export type SensitivityMode = 'auto' | 'low' | 'normal' | 'high';
export type TrainingState = 'idle' | 'calibratingAmbient' | 'calibratingShots' | 'ready' | 'countdown' | 'listening' | 'shotDetected' | 'replacingBall' | 'timeout' | 'paused' | 'error';
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
}

export interface CalibrationProfile {
  ambientRms: number;
  ambientPeak: number;
  shotRmsAverage: number;
  shotPeakAverage: number;
  shotDeltaAverage: number;
  rmsThreshold: number;
  peakThreshold: number;
  deltaThreshold: number;
  createdAt: number;
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
}

export interface FeedbackResult {
  status: ShotStatus;
  message: string;
  vocalMessage: string;
  variant: 'danger' | 'success' | 'warning' | 'info';
}

export interface TrainingStats {
  totalShots: number;
  tooEarlyCount: number;
  inZoneCount: number;
  timeoutCount: number;
  averageInZoneTime: number;
  isRegular: boolean;
}
