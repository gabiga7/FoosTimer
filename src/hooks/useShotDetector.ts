import { useState, useCallback, useRef } from 'react';
import { CalibrationProfile, TrainingSettings, AudioFeatures } from '../types';
import { computeRms, computePeak, computeDelta } from '../logic/audioMath';

export const useShotDetector = (
  audioContext: AudioContext | null,
  stream: MediaStream | null,
  profile: CalibrationProfile | null,
  settings: TrainingSettings,
  isPaused: boolean,
  onShotDetected: (time: number) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<AudioFeatures>({ rms: 0, peak: 0, delta: 0 });
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const averageRmsRef = useRef<number>(0);
  const samplesRef = useRef<Float32Array | null>(null);

  const startListening = useCallback(() => {
    if (!audioContext || !stream || !profile) return;

    if (!sourceRef.current) {
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      analyzerRef.current = audioContext.createAnalyser();
      analyzerRef.current.fftSize = 512;
      sourceRef.current.connect(analyzerRef.current);
      samplesRef.current = new Float32Array(analyzerRef.current.fftSize);
    }

    setIsListening(true);
    
    const analyze = () => {
      if (!analyzerRef.current || !samplesRef.current) return;
      
      analyzerRef.current.getFloatTimeDomainData(samplesRef.current);
      
      const rms = computeRms(samplesRef.current as any);
      const peak = computePeak(samplesRef.current as any);
      
      // Update moving average for delta
      averageRmsRef.current = averageRmsRef.current * 0.9 + rms * 0.1;
      const delta = computeDelta(rms, averageRmsRef.current);
      
      setCurrentAudio({ rms, peak, delta });

      const now = Date.now();
      const cooldown = 800; // ms

      if (!isPaused && now - lastDetectionRef.current > cooldown) {
        // Sensitivity multipliers
        let sensMult = 1;
        if (settings.sensitivityMode === 'high') sensMult = 0.7;
        if (settings.sensitivityMode === 'low') sensMult = 1.5;

        const isShot = 
          rms > profile.rmsThreshold * sensMult &&
          peak > profile.peakThreshold * sensMult &&
          delta > profile.deltaThreshold * sensMult;

        if (isShot) {
          lastDetectionRef.current = now;
          onShotDetected(now);
        }
      }

      rafRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [audioContext, stream, profile, settings, isPaused, onShotDetected]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    isListening,
    currentAudio,
    startListening,
    stopListening
  };
};
