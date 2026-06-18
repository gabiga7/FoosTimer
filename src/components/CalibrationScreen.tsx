import React, { useState, useRef } from 'react';
import { CalibrationProfile, TrainingSettings } from '../types';
import { computeRms, computePeak, computeDelta } from '../logic/audioMath';
import { translations } from '../logic/translations';

interface Props {
  settings: TrainingSettings;
  onSave: (profile: CalibrationProfile) => void;
  onBack: () => void;
}

const CalibrationScreen: React.FC<Props> = ({ settings, onSave, onBack }) => {
  const t = translations[settings.language || 'fr'];
  const [step, setStep] = useState<'intro' | 'ambient' | 'shots' | 'done'>('intro');
  const [progress, setProgress] = useState(0);
  const [shotsCaptured, setShotsCaptured] = useState<any[]>([]);
  const [ambientData, setAmbientData] = useState({ rms: 0, peak: 0 });
  const [currentRms, setCurrentRms] = useState(0);
  
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const startCalibration = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      alert("Accès micro refusé ou non supporté.");
      onBack();
    }
  };

  const measureAmbient = (analyzer: AnalyserNode) => {
    const samples = new Float32Array(analyzer.fftSize);
    let count = 0;
    let sumRms = 0;
    let sumPeak = 0;
    const duration = 3000;
    const start = Date.now();

    const check = () => {
      const now = Date.now();
      const p = (now - start) / duration;
      setProgress(p);

      analyzer.getFloatTimeDomainData(samples);
      const rms = computeRms(samples);
      setCurrentRms(rms);
      sumRms += rms;
      sumPeak += computePeak(samples);
      count++;

      if (now - start < duration) {
        requestAnimationFrame(check);
      } else {
        setAmbientData({ rms: sumRms / count, peak: sumPeak / count });
        setStep('shots');
        startShotDetection(analyzer);
      }
    };
    check();
  };

  const startShotDetection = (analyzer: AnalyserNode) => {
    const samples = new Float32Array(analyzer.fftSize);
    let captured: any[] = [];
    let lastDetection = 0;
    let avgRms = 0;

    const detect = () => {
      if (step === 'done') return;
      analyzer.getFloatTimeDomainData(samples);
      const rms = computeRms(samples);
      setCurrentRms(rms);
      
      const peak = computePeak(samples);
      avgRms = avgRms * 0.9 + rms * 0.1;
      const delta = computeDelta(rms, avgRms);

      const now = Date.now();
      if (now - lastDetection > 800) {
        if (peak > 0.1 && delta > 0.05) {
          lastDetection = now;
          captured.push({ rms, peak, delta });
          setShotsCaptured([...captured]);
          if (captured.length >= 5) {
            finishCalibration(captured);
            return;
          }
        }
      }
      requestAnimationFrame(detect);
    };
    detect();
  };

  const finishCalibration = (shots: any[]) => {
    const avgShotRms = shots.reduce((a, b) => a + b.rms, 0) / shots.length;
    const avgShotPeak = shots.reduce((a, b) => a + b.peak, 0) / shots.length;
    const avgShotDelta = shots.reduce((a, b) => a + b.delta, 0) / shots.length;

    const profile: CalibrationProfile = {
      ambientRms: ambientData.rms,
      ambientPeak: ambientData.peak,
      shotRmsAverage: avgShotRms,
      shotPeakAverage: avgShotPeak,
      shotDeltaAverage: avgShotDelta,
      rmsThreshold: ambientData.rms + (avgShotRms - ambientData.rms) * 0.3,
      peakThreshold: ambientData.peak + (avgShotPeak - ambientData.peak) * 0.3,
      deltaThreshold: avgShotDelta * 0.4,
      createdAt: Date.now()
    };

    onSave(profile);
    setStep('done');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
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

      {step === 'ambient' && (
        <div className="card">
          <p>{t.calibrationAmbient}</p>
          <div style={{ height: '40px', background: '#333', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '15px' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--primary-color)', 
              width: `${Math.min(100, currentRms * 500)}%`,
              transition: 'width 0.05s linear'
            }}></div>
          </div>
          <div style={{ height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#666', width: `${progress * 100}%` }}></div>
          </div>
        </div>
      )}

      {step === 'shots' && (
        <div className="card">
          <p>{t.calibrationShots}</p>
          <div style={{ height: '60px', background: '#333', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--secondary-color)', 
              width: `${Math.min(100, currentRms * 500)}%`,
              transition: 'width 0.05s linear'
            }}></div>
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: '20%', 
              height: '100%', 
              width: '2px', 
              background: 'rgba(255,255,255,0.2)' 
            }}></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{shotsCaptured.length} / 5</div>
          <p className="text-muted">{t.calibrationCaptured}</p>
        </div>
      )}

      {step === 'done' && (
        <div className="card">
          <p>{t.calibrationDone}</p>
          <button className="big-button big-button-primary" onClick={onBack}>{t.back}</button>
        </div>
      )}

      <button className="big-button big-button-secondary" onClick={onBack}>{t.back}</button>
    </div>
  );
};

export default CalibrationScreen;
