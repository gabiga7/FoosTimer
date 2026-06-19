import React from 'react';

interface Props {
  settings: TrainingSettings;
  onStart: () => void;
  onCalibrate: () => void;
  onSettings: () => void;
  onPrivacy: () => void;
}

import { translations } from '../logic/translations';
import { TrainingSettings } from '../types';

const HomeScreen: React.FC<Props> = ({ settings, onStart, onCalibrate, onSettings, onPrivacy }) => {
  const lang = settings.language || 'fr';
  const t = translations[lang];
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

      <div className="card" style={{ marginTop: '20px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid #333' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>📲 Installer l'application</p>
        <p style={{ margin: '4px 0' }}>Tu peux installer FoosTimer sur ton téléphone depuis le menu du navigateur :</p>
        <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
          <li><strong>Android :</strong> Menu Chrome → Installer</li>
          <li><strong>iPhone :</strong> Partager → Sur l'écran d'accueil</li>
        </ul>
      </div>
    </div>
  );
};

export default HomeScreen;
