import React, { useState, useEffect } from 'react';
import { TrainingSettings } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { translations } from '../logic/translations';

interface Props {
  settings: TrainingSettings;
  onSave: (s: TrainingSettings) => void;
  onBack: () => void;
  onResetProfile: () => void;
}

const SettingsScreen: React.FC<Props> = ({ settings, onSave, onBack, onResetProfile }) => {
  const [local, setLocal] = useState(settings);
  const { speak, voices } = useSpeech(local.language);
  const t = translations[local.language || 'fr'];

  const handleChange = (key: keyof TrainingSettings, value: any) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onSave(next);
  };

  const currentVoices = voices.filter(v => v.lang.startsWith(local.language === 'en' ? 'en' : 'fr'));

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h2>{t.settings}</h2>

      <div className="card">
        <h3>Language</h3>
        <div className="grid-2">
          <button 
            className={`big-button ${local.language === 'fr' ? 'big-button-primary' : 'big-button-secondary'}`}
            onClick={() => handleChange('language', 'fr')}
          >
            Français
          </button>
          <button 
            className={`big-button ${local.language === 'en' ? 'big-button-primary' : 'big-button-secondary'}`}
            onClick={() => handleChange('language', 'en')}
          >
            English
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3>{t.timing}</h3>
        <div className="form-group">
          <label>{t.maxDuration}</label>
          <input type="number" value={local.maxDurationSeconds} onChange={e => handleChange('maxDurationSeconds', Number(e.target.value))} />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>{t.tooEarlySeuil}</label>
            <input type="number" value={local.tooEarlySeconds} onChange={e => handleChange('tooEarlySeconds', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>{t.replacementTime}</label>
            <input type="number" value={local.replaceBallSeconds} onChange={e => handleChange('replaceBallSeconds', Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>{t.voice}</h3>
        <div className="form-group">
          <label>{t.voiceEnabled}</label>
          <button 
            className={`big-button ${local.voiceEnabled ? 'big-button-primary' : 'big-button-secondary'}`}
            onClick={() => handleChange('voiceEnabled', !local.voiceEnabled)}
          >
            {local.voiceEnabled ? t.yes : t.no}
          </button>
        </div>

        {local.voiceEnabled && (
          <>
            <div className="form-group">
              <label>{t.chooseVoice}</label>
              <select 
                value={local.voiceVoiceURI || ''} 
                onChange={e => handleChange('voiceVoiceURI', e.target.value)}
              >
                <option value="">{local.language === 'en' ? 'Auto (Best available)' : 'Auto (Meilleure dispo)'}</option>
                {currentVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t.speed}: {(local.voiceRate ?? 1.0).toFixed(1)}</label>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={local.voiceRate ?? 1.0} 
                onChange={e => handleChange('voiceRate', Number(e.target.value))} 
                style={{ width: '100%' }}
              />
            </div>

            <button 
              className="big-button big-button-secondary"
              onClick={() => speak(t.testPhrase, { 
                voiceURI: local.voiceVoiceURI, 
                rate: local.voiceRate ?? 1.0
              })}
            >
              {t.testVoice}
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h3>{t.system}</h3>
        <div className="form-group">
          <label>{t.debugMode}</label>
          <button 
            className={`big-button ${local.debugMode ? 'big-button-primary' : 'big-button-secondary'}`}
            onClick={() => handleChange('debugMode', !local.debugMode)}
          >
            {local.debugMode ? t.active : t.inactive}
          </button>
        </div>
        <button className="big-button big-button-danger" onClick={onResetProfile} style={{ fontSize: '0.9rem' }}>
          {t.resetCalibration}
        </button>
      </div>

      <button className="big-button big-button-primary" onClick={onBack}>OK</button>
    </div>
  );
};

export default SettingsScreen;
