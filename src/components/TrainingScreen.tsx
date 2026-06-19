import React from 'react';
import { TrainingSettings, CalibrationProfile } from '../types';
import { useTrainingSession } from '../hooks/useTrainingSession';

interface Props {
  settings: TrainingSettings;
  profile: CalibrationProfile | null;
  onBack: () => void;
}

import { translations } from '../logic/translations';

const TrainingScreen: React.FC<Props> = ({ settings, profile, onBack }) => {
  const t = translations[settings.language || 'fr'];
  const {
    state,
    history,
    timer,
    startTraining,
    stopTraining,
    handleManualShot,
    debugInfo
  } = useTrainingSession(settings, profile);

  if (!profile && state === 'idle') {
    return (
      <div className="text-center">
        <h2>{t.resetCalibration}</h2>
        <p>{t.calibrateMic}</p>
        <button className="big-button big-button-primary" onClick={onBack}>{t.back}</button>
      </div>
    );
  }

  return (
    <div className="training-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem' }}>{t.quit}</button>
        <div className={`status-badge badge-${state === 'listening' ? 'listening' : 'waiting'}`}>
          {state}
        </div>
      </div>

      <div className="card">
        <div className="timer-display" style={{ color: state === 'listening' ? 'var(--primary-color)' : 'var(--text-color)' }}>
          {timer.toFixed(1)}s
        </div>
        <div className="text-center text-muted" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
          {state === 'listening' ? t.listening : 
           state === 'replacingBall' ? t.replaceBall : 
           state === 'countdown' ? t.ready : t.inactive}
        </div>
      </div>

      <div className="grid-2">
        {state === 'idle' ? (
          <button className="big-button big-button-primary" onClick={startTraining} style={{ gridColumn: 'span 2' }}>
            {t.start}
          </button>
        ) : (
          <>
            <button className="big-button big-button-danger" onClick={stopTraining}>{t.stop}</button>
            <button className="big-button big-button-secondary" onClick={handleManualShot}>{t.manualShot}</button>
          </>
        )}
      </div>

      {settings.debugMode && (
        <div className="card" style={{ fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: '1.4' }}>
          <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '5px' }}>AUDIO DEBUG</div>
          <div className="grid-2">
            <div>
              RMS: {debugInfo.rms.toFixed(4)}<br/>
              PEAK: {debugInfo.peak.toFixed(4)}<br/>
              DELTA: {debugInfo.delta.toFixed(4)}<br/>
              FREQ: {debugInfo.highFreq.toFixed(3)}
            </div>
            <div style={{ borderLeft: '1px solid #444', paddingLeft: '10px' }}>
              SCORE: <span style={{ fontSize: '1.2rem', color: debugInfo.score >= settings.detectionScoreThreshold ? 'var(--primary-color)' : 'white' }}>{debugInfo.score}</span> / {settings.detectionScoreThreshold}<br/>
              SHORT: {debugInfo.isPeakShort ? 'YES' : 'NO'}<br/>
              REJECT: <span style={{ color: 'var(--danger)' }}>{detector.lastRejectReason}</span>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: '1.5rem', textAlign: 'left' }}>{t.history}</h3>
      <div className="card" style={{ padding: '0', maxHeight: '200px', overflowY: 'auto' }}>
        <div className="history-list">
          {history.map(event => (
            <div key={event.id} className="history-item">
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {event.type === 'shot' ? `${event.timeSeconds.toFixed(1)}s` : 'MISS'}
                </div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{event.message}</div>
              </div>
              <div style={{ 
                color: event.status === 'good' ? 'var(--primary-color)' : 
                       event.status === 'too_early' ? 'var(--danger)' : 'var(--warning)' 
              }}>
                ●
              </div>
            </div>
          ))}
          {history.length === 0 && <div className="text-center text-muted" style={{ padding: '20px' }}>{t.noShots}</div>}
        </div>
      </div>
    </div>
  );
};

export default TrainingScreen;
