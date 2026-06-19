import { useState, useCallback, useRef, useEffect } from 'react';
import { CalibrationProfile, TrainingSettings, AudioFeatures } from '../types';
import { computeRms, computePeak, computeDelta, computeHighFrequencyRatio } from '../logic/audioMath';

export const useShotDetector = (
  audioContext: AudioContext | null,
  stream: MediaStream | null,
  profile: CalibrationProfile | null,
  settings: TrainingSettings,
  isActive: boolean,
  onShotDetected: (time: number, score: number) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<AudioFeatures>({ 
    rms: 0, peak: 0, delta: 0, highFreq: 0, score: 0, isPeakShort: false 
  });
  const [lastRejectReason, setLastRejectReason] = useState<string>('');

  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const averageRmsRef = useRef<number>(0);
  
  // Buffers for duration analysis
  const peakDurationRef = useRef<number>(0);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const samplesRef = useRef<Float32Array | null>(null);

  const startListening = useCallback(() => {
    if (!audioContext || !stream || !profile) return;

    if (!sourceRef.current) {
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      analyzerRef.current = audioContext.createAnalyser();
      analyzerRef.current.fftSize = 512;
      sourceRef.current.connect(analyzerRef.current);
      samplesRef.current = new Float32Array(analyzerRef.current.fftSize);
      freqDataRef.current = new Uint8Array(analyzerRef.current.frequencyBinCount);
    }

    setIsListening(true);
    
    const analyze = () => {
      if (!analyzerRef.current || !samplesRef.current || !freqDataRef.current) return;
      
      analyzerRef.current.getFloatTimeDomainData(samplesRef.current);
      analyzerRef.current.getByteFrequencyData(freqDataRef.current);
      
      const rms = computeRms(samplesRef.current);
      const peak = computePeak(samplesRef.current);
      const highFreq = computeHighFrequencyRatio(freqDataRef.current);
      
      averageRmsRef.current = averageRmsRef.current * 0.8 + rms * 0.2;
      const delta = computeDelta(rms, averageRmsRef.current);
      
      // Feature Scoring
      let score = 0;
      if (rms > profile.rmsThreshold) score++;
      if (peak > profile.peakThreshold) score++;
      if (delta > profile.deltaThreshold) score++;
      if (highFreq > profile.highFreqThreshold) score++;

      // Peak length check (attack and decay)
      // If peak is high, we track how many frames it stays high
      const isCurrentlyHigh = peak > profile.peakThreshold;
      if (isCurrentlyHigh) {
        peakDurationRef.current++;
      } else {
        peakDurationRef.current = 0;
      }

      // A foosball shot is very short (typically < 150ms, so < 5 frames at 30ms)
      const isPeakShort = peakDurationRef.current > 0 && peakDurationRef.current < 6;
      if (isPeakShort && peakDurationRef.current > 0) score += 2;

      setCurrentAudio({ rms, peak, delta, highFreq, score, isPeakShort });

      const now = Date.now();
      const cooldown = settings.cooldownMs || 800;

      if (isActive && now - lastDetectionRef.current > cooldown) {
        let requiredScore = settings.detectionScoreThreshold || 4;
        
        // Manual sensitivity adjustment
        if (settings.sensitivityMode === 'high') requiredScore -= 1;
        if (settings.sensitivityMode === 'low') requiredScore += 1;

        if (score >= requiredScore) {
          lastDetectionRef.current = now;
          onShotDetected(now, score);
          setLastRejectReason('');
        } else if (isCurrentlyHigh) {
          setLastRejectReason(`Score ${score}/${requiredScore}`);
        }
      } else if (isActive && isCurrentlyHigh) {
        setLastRejectReason('Cooldown');
      }

      rafRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [audioContext, stream, profile, settings, isActive, onShotDetected]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    isListening,
    currentAudio,
    lastRejectReason,
    startListening,
    stopListening
  };
};
