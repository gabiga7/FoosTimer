import { useState, useCallback, useRef, useEffect } from 'react';

import { translations, Language } from '../logic/translations';

export const useSpeech = (lang: Language = 'fr') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synth = window.speechSynthesis;
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const speak = useCallback((text: string, options?: { voiceURI?: string; rate?: number; onEnd?: () => void }) => {
    if (!synth) return;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (options?.voiceURI) {
      const selectedVoice = synth.getVoices().find(v => v.voiceURI === options.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    } else {
      const availableVoices = synth.getVoices();
      const langCode = lang === 'fr' ? 'fr-FR' : 'en-US';
      const preferredNames = lang === 'fr' 
        ? ['Google', 'Premium', 'Thomas', 'Audrey'] 
        : ['Google', 'Premium', 'Samantha', 'Daniel', 'Alex'];

      const preferredVoice = availableVoices.find(v => 
        v.lang.startsWith(langCode.split('-')[0]) && 
        preferredNames.some(name => v.name.includes(name))
      ) || availableVoices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (typeof options === 'function') {
        (options as any)();
      } else {
        options?.onEnd?.();
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    currentUtterance.current = utterance;
    synth.speak(utterance);
  }, [synth]);

  const cancel = useCallback(() => {
    synth?.cancel();
    setIsSpeaking(false);
  }, [synth]);

  useEffect(() => {
    return () => synth?.cancel();
  }, [synth]);

  return {
    speak,
    cancel,
    isSpeaking,
    voices,
    isSupported: !!synth
  };
};
