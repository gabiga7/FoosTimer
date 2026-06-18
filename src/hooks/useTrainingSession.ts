import { useState, useCallback, useRef, useEffect } from 'react';
import { TrainingSettings, CalibrationProfile, ShotEvent, TrainingState } from '../types';
import { useSpeech } from './useSpeech';
import { useBeep } from './useBeep';
import { useShotDetector } from './useShotDetector';
import { getShotFeedback } from '../logic/feedback';
import { translations } from '../logic/translations';

export const useTrainingSession = (
  settings: TrainingSettings,
  profile: CalibrationProfile | null
) => {
  const lang = settings.language || 'fr';
  const t = translations[lang];
  const [state, setState] = useState<TrainingState>('idle');
  const [history, setHistory] = useState<ShotEvent[]>([]);
  const [timer, setTimer] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeech(settings.language);
  const { playBeep } = useBeep(audioContext);

  const stopAudio = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
  }, [stream, audioContext]);

  const addEvent = useCallback((event: Omit<ShotEvent, 'id' | 'createdAt'>) => {
    const newEvent: ShotEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setHistory(prev => [newEvent, ...prev].slice(0, 100));
  }, []);

  // Declarations to fix "used before declaration"
  const startListeningState = useCallback(() => {
    setState('listening');
    startTimeRef.current = Date.now();
    setTimer(0);
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTimer(elapsed);

      if (elapsed >= settings.maxDurationSeconds) {
        handleTimeout();
      }
    }, 100);
  }, [settings.maxDurationSeconds]);

  const startCountdown = useCallback(() => {
    setState('countdown');
    if (settings.voiceEnabled) {
      const phrase = settings.language === 'en' ? "3... 2... 1... go" : "3... 2... 1... top";
      speak(phrase, { 
        voiceURI: settings.voiceVoiceURI, 
        rate: settings.voiceRate, 
        onEnd: startListeningState 
      });
    } else {
      let count = 3;
      setTimer(count);
      const interval = window.setInterval(() => {
        count -= 1;
        setTimer(count);
        if (count <= 0) {
          clearInterval(interval);
          startListeningState();
        }
      }, 1000);
    }
  }, [settings, speak, startListeningState]);

  const startReplacement = useCallback(() => {
    setState('replacingBall');
    let remaining = settings.replaceBallSeconds;
    setTimer(remaining);
    
    const interval = window.setInterval(() => {
      remaining -= 1;
      setTimer(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        startCountdown();
      }
    }, 1000);
  }, [settings.replaceBallSeconds, startCountdown]);

  const handleTimeout = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    addEvent({
      type: 'timeout',
      timeSeconds: settings.maxDurationSeconds,
      status: 'timeout',
      message: t.timeout
    });
    setState('timeout');
    if (settings.beepEnabled) playBeep(220, 0.5);
    if (settings.voiceEnabled) {
      speak(t.timeout, { 
        voiceURI: settings.voiceVoiceURI, 
        rate: settings.voiceRate, 
        onEnd: startReplacement 
      });
    } else {
      setTimeout(startReplacement, 1000);
    }
  }, [settings, speak, addEvent, playBeep, startReplacement, t.timeout]);

  const handleShot = useCallback((detectionTime: number) => {
    if (state !== 'listening') return;
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const elapsed = (detectionTime - startTimeRef.current) / 1000;
    
    const feedback = getShotFeedback(elapsed, settings, history, settings.language);
    addEvent({
      type: 'shot',
      timeSeconds: elapsed,
      status: feedback.status,
      message: feedback.message
    });

    setState('shotDetected');
    if (settings.voiceEnabled) {
      speak(feedback.vocalMessage, { 
        voiceURI: settings.voiceVoiceURI, 
        rate: settings.voiceRate, 
        onEnd: startReplacement 
      });
    } else {
      setTimeout(startReplacement, 1000);
    }
  }, [state, settings, history, speak, addEvent, startReplacement]);

  const startTraining = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setStream(newStream);
      setAudioContext(newCtx);
      if (newCtx.state === 'suspended') {
        await newCtx.resume();
      }
      startCountdown();
    } catch (err) {
      setState('error');
      console.error(err);
    }
  };

  const stopTraining = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    cancelSpeech();
    stopAudio();
    setState('idle');
  };

  const detector = useShotDetector(
    audioContext,
    stream,
    profile,
    settings,
    state !== 'listening' || isSpeaking,
    handleShot
  );

  useEffect(() => {
    if (state === 'listening' && !detector.isListening) {
      detector.startListening();
    }
    return () => detector.stopListening();
  }, [state, detector]);

  return {
    state,
    history,
    timer,
    startTraining,
    stopTraining,
    handleManualShot: () => handleShot(Date.now()),
    debugInfo: detector.currentAudio
  };
};
