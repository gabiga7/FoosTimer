import React, { useState, useRef } from 'react';
import { CalibrationProfile, TrainingSettings } from '../types';
import { computeRms, computePeak, computeDelta, computeHighFrequencyRatio, percentile, median } from '../logic/audioMath';
import { translations } from '../logic/translations';

interface Props {
  settings: TrainingSettings;
  onSave: (profile: CalibrationProfile) => void;
  onBack: () => void;
}

const CalibrationScreen: React.FC<Props> = ({ settings, onSave, onBack }) => {
  const t = translations[settings.language || 'fr'];
  const [step, setStep] = useState<'intro' | 'ambient' | 'dribble' | 'shots' | 'done'>('intro');
  const [progress, setProgress] = useState(0);
  const [currentRms, setCurrentRms] = useState(0);
  const [quality, setQuality] = useState<CalibrationProfile['quality']>('medium');
  
  // Data Collection
  const ambientBuffer = useRef<{rms: number[], peak: number[]}>({ rms: [], peak: [] });
  const dribbleBuffer = useRef<{rms: number[], peak: number[], delta: number[], highFreq: number[]}>({ rms: [], peak: [], delta: [], highFreq: [] });
  const shotBuffer = useRef<{rms: number[], peak: number[], delta: number[], highFreq: number[]}[]>([]);
  const [shotsCapturedCount, setShotsCapturedCount] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const startCalibration = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false 
        } 
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 512;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      setStep('ambient');
      measureAmbient(analyzer);
    } catch (err) {
      alert("Accès micro refusé ou contraintes non supportées. Essai avec réglages par défaut.");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        // ... repeat initialization with simple stream
      } catch(e) { onBack(); }
    }
  };

  const measureAmbient = (analyzer: AnalyserNode) => {
    const samples = new Float32Array(analyzer.fftSize);
    const duration = 5000;
    const start = Date.now();

    const check = () => {
      const now = Date.now();
      setProgress((now - start) / duration);
      analyzer.getFloatTimeDomainData(samples);
      const rms = computeRms(samples);
      ambientBuffer.current.rms.push(rms);
      ambientBuffer.current.peak.push(computePeak(samples));
      setCurrentRms(rms);

      if (now - start < duration) requestAnimationFrame(check);
      else {
        setStep('dribble');
        measureDribble(analyzer);
      }
    };
    check();
  };

  const measureDribble = (analyzer: AnalyserNode) => {
    const samples = new Float32Array(analyzer.fftSize);
    const freqData = new Uint8Array(analyzer.frequencyBinCount);
    let avgRms = 0;
    const duration = 5000;
    const start = Date.now();

    const check = () => {
      const now = Date.now();
      setProgress((now - start) / duration);
      analyzer.getFloatTimeDomainData(samples);
      analyzer.getByteFrequencyData(freqData);
      
      const rms = computeRms(samples);
      const peak = computePeak(samples);
      avgRms = avgRms * 0.9 + rms * 0.1;
      const delta = computeDelta(rms, avgRms);
      const hf = computeHighFrequencyRatio(freqData);

      dribbleBuffer.current.rms.push(rms);
      dribbleBuffer.current.peak.push(peak);
      dribbleBuffer.current.delta.push(delta);
      dribbleBuffer.current.highFreq.push(hf);
      setCurrentRms(rms);

      if (now - start < duration) requestAnimationFrame(check);
      else {
        setStep('shots');
        startShotDetection(analyzer);
      }
    };
    check();
  };

  const startShotDetection = (analyzer: AnalyserNode) => {
    const samples = new Float32Array(analyzer.fftSize);
    const freqData = new Uint8Array(analyzer.frequencyBinCount);
    let lastDetection = 0;
    let avgRms = 0;

    const detect = () => {
      if (step === 'done') return;
      analyzer.getFloatTimeDomainData(samples);
      analyzer.getByteFrequencyData(freqData);
      const rms = computeRms(samples);
      const peak = computePeak(samples);
      avgRms = avgRms * 0.9 + rms * 0.1;
      const delta = computeDelta(rms, avgRms);
      const hf = computeHighFrequencyRatio(freqData);
      setCurrentRms(rms);

      const now = Date.now();
      // Robust detection during calibration: use a temporary high threshold
      if (now - lastDetection > 1000 && peak > 0.2 && delta > 0.05) {
        lastDetection = now;
        shotBuffer.current.push({ rms: [rms], peak: [peak], delta: [delta], highFreq: [hf] });
        setShotsCapturedCount(shotBuffer.current.length);
        if (shotBuffer.current.length >= 5) {
          calculateFinalProfile();
          return;
        }
      }
      requestAnimationFrame(detect);
    };
    detect();
  };

  const calculateFinalProfile = () => {
    const d = dribbleBuffer.current;
    const dribblePeakP95 = percentile(d.peak, 95);
    const dribbleDeltaP95 = percentile(d.delta, 95);
    const dribbleRmsP95 = percentile(d.rms, 95);
    const dribbleHfP95 = percentile(d.highFreq, 95);

    const sRms = shotBuffer.current.map(s => s.rms[0]);
    const sPeak = shotBuffer.current.map(s => s.peak[0]);
    const sDelta = shotBuffer.current.map(s => s.delta[0]);
    const sHf = shotBuffer.current.map(s => s.highFreq[0]);

    const shotRmsP20 = percentile(sRms, 20);
    const shotPeakP20 = percentile(sPeak, 20);
    const shotDeltaP20 = percentile(sDelta, 20);
    const shotHfP20 = percentile(sHf, 20);

    // Quality assessment
    const separation = shotPeakP20 / (dribblePeakP95 + 0.01);
    let q: CalibrationProfile['quality'] = 'poor';
    if (separation > 2.0) q = 'good';
    else if (separation > 1.3) q = 'medium';
    setQuality(q);

    const profile: CalibrationProfile = {
      rmsThreshold: (dribbleRmsP95 + shotRmsP20) / 2,
      peakThreshold: (dribblePeakP95 + shotPeakP20) / 2,
      deltaThreshold: (dribbleDeltaP95 + shotDeltaP20) / 2,
      highFreqThreshold: (dribbleHfP95 + shotHfP20) / 2,
      quality: q,
      qualityScore: separation,
      createdAt: Date.now(),
      ambientRmsMedian: median(ambientBuffer.current.rms),
      dribblePeakP95,
      shotPeakP20
    };

    onSave(profile);
    setStep('done');
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  return (
    <div className="text-center">
      <h2>{t.calibrationTitle}</h2>
      
      {step === 'intro' && (
        <div className="card">
          <p>{t.calibrationIntro}</p>
          <button className="big-button big-button-primary" onClick={startCalibration}>{t.calibrationStart}</button>
        </div>
      )}

      {(step === 'ambient' || step === 'dribble') && (
        <div className="card">
          <p>{step === 'ambient' ? t.calibrationAmbient : t.calibrationDribble}</p>
          <div style={{ height: '40px', background: '#333', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '15px' }}>
            <div style={{ height: '100%', background: step === 'ambient' ? 'var(--primary-color)' : 'var(--info)', width: `${Math.min(100, currentRms * 500)}%` }}></div>
          </div>
          <div style={{ height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#666', width: `${progress * 100}%` }}></div>
          </div>
        </div>
      )}

      {step === 'shots' && (
        <div className="card">
          <p>{t.calibrationShots}</p>
          <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{shotsCapturedCount} / 5</div>
        </div>
      )}

      {step === 'done' && (
        <div className="card">
          <p>{t.calibrationDone}</p>
          <div className={`status-badge ${quality === 'good' ? 'badge-listening' : quality === 'medium' ? 'badge-waiting' : 'badge-danger'}`}>
             Qualité: {quality}
          </div>
          <button className="big-button big-button-primary" onClick={onBack} style={{ marginTop: '20px' }}>{t.back}</button>
        </div>
      )}

      <button className="big-button big-button-secondary" onClick={onBack}>{t.back}</button>
    </div>
  );
};

export default CalibrationScreen;
