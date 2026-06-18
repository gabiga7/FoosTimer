import React from 'react';

interface Props {
  settings: TrainingSettings;
  onStart: () => void;
  onCalibrate: () => void;
  onSettings: () => void;
  onPrivacy: () => void;
}

import { translations } from '../logic/translations';

const HomeScreen: React.FC<Props> = ({ settings, onStart, onCalibrate, onSettings, onPrivacy }) => {
  const t = translations[settings.language || 'fr'];
  return (
    <div className="text-center">
      <h1 style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{t.title}</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>{t.subtitle}</p>
      
      <div className="card">
        <p>{t.setupHint}</p>
      </div>

      <button className="big-button big-button-primary" onClick={onStart}>
        {t.startTraining}
      </button>
      
      <button className="big-button big-button-secondary" onClick={onCalibrate}>
        {t.calibrateMic}
      </button>
      
      <button className="big-button big-button-secondary" onClick={onSettings}>
        {t.settings}
      </button>
      
      <button className="big-button big-button-secondary" onClick={onPrivacy} style={{ fontSize: '0.9rem', padding: '12px' }}>
        {t.privacy}
      </button>
    </div>
  );
};

export default HomeScreen;
