import React from 'react';

import { translations } from '../logic/translations';

const PrivacyScreen: React.FC<{ settings: any, onBack: () => void }> = ({ settings, onBack }) => {
  const t = translations[settings.language || 'fr'];
  return (
    <div>
      <h2>{t.privacyTitle}</h2>
      <div className="card">
        <p>{t.privacyText1}</p>
        <p><strong>{t.privacyText2}</strong></p>
        <p><strong>{t.privacyText3}</strong></p>
        <p>{t.privacyText4}</p>
        <hr style={{ borderColor: '#333' }} />
        <ul>
          <li>{t.privacyList1}</li>
          <li>{t.privacyList2}</li>
          <li>{t.privacyList3}</li>
        </ul>
      </div>
      <button className="big-button big-button-primary" onClick={onBack}>{t.understand}</button>
    </div>
  );
};

export default PrivacyScreen;
