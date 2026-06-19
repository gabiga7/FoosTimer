export type SensitivityMode = 'low' | 'normal' | 'high';
export type TrainingState = 'idle' | 'calibratingAmbient' | 'calibratingDribble' | 'calibratingShots' | 'ready' | 'countdown' | 'listening' | 'shotDetected' | 'replacingBall' | 'timeout' | 'paused' | 'error' | 'validation';
export type ShotStatus = 'too_early' | 'good' | 'late' | 'timeout' | 'regular' | 'irregular';

export interface TrainingSettings {
  maxDurationSeconds: number;
  replaceBallSeconds: number;
  tooEarlySeconds: number;
  targetMinSeconds: number;
  targetMaxSeconds: number;
  regularityToleranceSeconds: number;
  voiceEnabled: boolean;
  voiceVoiceURI?: string;
  voiceRate: number;
  beepEnabled: boolean;
  sensitivityMode: SensitivityMode;
  debugMode: boolean;
  language: 'fr' | 'en';
  detectionScoreThreshold: number;
  cooldownMs: number;
}

export interface CalibrationProfile {
  rmsThreshold: number;
  peakThreshold: number;
  deltaThreshold: number;
  highFreqThreshold: number;
  quality: 'good' | 'medium' | 'poor';
  qualityScore: number;
  createdAt: number;
  // Metrics for debug
  ambientRmsMedian: number;
  dribblePeakP95: number;
  shotPeakP20: number;
}

export interface ShotEvent {
  id: string;
  type: 'shot' | 'timeout' | 'manual';
  timeSeconds: number;
  status: ShotStatus;
  message: string;
  createdAt: number;
}

export interface AudioFeatures {
  rms: number;
  peak: number;
  delta: number;
  highFreq: number;
  score: number;
  isPeakShort: boolean;
}

export interface FeedbackResult {
  status: ShotStatus;
  message: string;
  vocalMessage: string;
  variant: 'danger' | 'success' | 'warning' | 'info';
}
