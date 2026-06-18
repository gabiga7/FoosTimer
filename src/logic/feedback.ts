import { TrainingSettings, ShotEvent, FeedbackResult, ShotStatus } from '../types';

import { translations, Language } from './translations';

export const getShotFeedback = (
  timeSeconds: number,
  settings: TrainingSettings,
  history: ShotEvent[],
  lang: Language = 'fr'
): FeedbackResult => {
  const t = translations[lang];
  let status: ShotStatus = 'good';
  let message = t.goodTiming;
  let variant: FeedbackResult['variant'] = 'success';

  if (timeSeconds < settings.tooEarlySeconds) {
    status = 'too_early';
    message = t.tooEarly;
    variant = 'danger';
  } else if (timeSeconds > settings.targetMaxSeconds) {
    status = 'late';
    message = t.tooLate;
    variant = 'warning';
  }

  // Regularity check (last 3 shots)
  const recentShots = history.filter(h => h.type === 'shot').slice(0, 3);
  let regularitySuffix = '';
  if (recentShots.length === 3) {
    const times = [timeSeconds, ...recentShots.map(s => s.timeSeconds)];
    const min = Math.min(...times);
    const max = Math.max(...times);
    if (max - min <= settings.regularityToleranceSeconds) {
      regularitySuffix = t.regularity;
    }
  }

  const fullMessage = `${message}${regularitySuffix}`;
  const vocalMessage = `${t.shotIn} ${Math.round(timeSeconds)} ${t.seconds} : ${fullMessage}`;

  return {
    status,
    message: fullMessage,
    vocalMessage,
    variant
  };
};
