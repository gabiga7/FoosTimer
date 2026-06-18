import { useRef, useCallback } from 'react';

export const useBeep = (audioContext: AudioContext | null) => {
  const playBeep = useCallback((frequency = 440, duration = 0.1) => {
    if (!audioContext || audioContext.state === 'suspended') return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.value = frequency;

    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }, [audioContext]);

  return { playBeep };
};
