import React, { useState } from 'react';
import { translations } from '../logic/translations';
import { TrainingSettings } from '../types';

const SettingsScreen: React.FC<{ settings: TrainingSettings, onSave: any, onBack: any, onResetProfile: any }> = ({ settings, onSave, onBack, onResetProfile }) => {
  const [local, setLocal] = useState(settings);
  const t = translations[local.language || 'fr'];

  const handleChange = (key: keyof TrainingSettings, value: any) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onSave(next);
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h2>{t.settings}</h2>

      <div className="card">
        <h3>Language / Langue</h3>
        <div className="grid-2">
          <button className={`big-button ${local.language === 'fr' ? 'big-button-primary' : 'big-button-secondary'}`} onClick={() => handleChange('language', 'fr')}>Français</button>
          <button className={`big-button ${local.language === 'en' ? 'big-button-primary' : 'big-button-secondary'}`} onClick={() => handleChange('language', 'en')}>English</button>
        </div>
      </div>

      <div className="card">
        <h3>Expert Audio</h3>
        <div className="form-group">
          <label>Score Threshold (Default: 4)</label>
          <input type="number" min="1" max="6" value={local.detectionScoreThreshold} onChange={e => handleChange('detectionScoreThreshold', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Cooldown (ms)</label>
          <input type="number" step="100" min="200" value={local.cooldownMs} onChange={e => handleChange('cooldownMs', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>{t.debugMode}</label>
          <button className={`big-button ${local.debugMode ? 'big-button-primary' : 'big-button-secondary'}`} onClick={() => handleChange('debugMode', !local.debugMode)}>
            {local.debugMode ? t.active : t.inactive}
          </button>
        </div>
      </div>

      <button className="big-button big-button-danger" onClick={onResetProfile}>{t.resetCalibration}</button>
      <button className="big-button big-button-primary" onClick={onBack}>OK</button>
    </div>
  );
};

export default SettingsScreen;
