import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import TrainingScreen from './components/TrainingScreen';
import CalibrationScreen from './components/CalibrationScreen';
import SettingsScreen from './components/SettingsScreen';
import PrivacyScreen from './components/PrivacyScreen';
import { TrainingSettings, CalibrationProfile } from './types';
import './styles.css';

const DEFAULT_SETTINGS: TrainingSettings = {
  maxDurationSeconds: 15,
  replaceBallSeconds: 5,
  tooEarlySeconds: 5,
  targetMinSeconds: 8,
  targetMaxSeconds: 12,
  regularityToleranceSeconds: 3,
  voiceEnabled: true,
  voiceRate: 1.0,
  beepEnabled: true,
  sensitivityMode: 'normal',
  debugMode: false,
  language: 'fr'
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'training' | 'calibration' | 'settings' | 'privacy'>('home');
  const [settings, setSettings] = useState<TrainingSettings>(() => {
    const saved = localStorage.getItem('foostimer_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  });
  const [profile, setProfile] = useState<CalibrationProfile | null>(() => {
    const saved = localStorage.getItem('foostimer_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const saveSettings = (newSettings: TrainingSettings) => {
    setSettings(newSettings);
    localStorage.setItem('foostimer_settings', JSON.stringify(newSettings));
  };

  const saveProfile = (newProfile: CalibrationProfile) => {
    setProfile(newProfile);
    localStorage.setItem('foostimer_profile', JSON.stringify(newProfile));
  };

  return (
    <div className="container">
      {view === 'home' && (
        <HomeScreen 
          settings={settings}
          onStart={() => setView('training')} 
          onCalibrate={() => setView('calibration')}
          onSettings={() => setView('settings')}
          onPrivacy={() => setView('privacy')}
        />
      )}
      {view === 'training' && (
        <TrainingScreen 
          settings={settings} 
          profile={profile} 
          onBack={() => setView('home')} 
        />
      )}
      {view === 'calibration' && (
        <CalibrationScreen 
          settings={settings}
          onSave={saveProfile} 
          onBack={() => setView('home')} 
        />
      )}
      {view === 'settings' && (
        <SettingsScreen 
          settings={settings} 
          onSave={saveSettings} 
          onBack={() => setView('home')} 
          onResetProfile={() => {
            localStorage.removeItem('foostimer_profile');
            setProfile(null);
          }}
        />
      )}
      {view === 'privacy' && (
        <PrivacyScreen settings={settings} onBack={() => setView('home')} />
      )}
    </div>
  );
};

export default App;
