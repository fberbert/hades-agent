import React from 'react';
import { MessageSquare, Volume2 } from 'lucide-react';
import { SettingsData } from '../../types/electron';

interface ResponseTabProps {
  settings: SettingsData['response'];
  updateSettings: (updates: Partial<SettingsData['response']>) => void;
}

const ResponseTab: React.FC<ResponseTabProps> = ({ settings, updateSettings }) => {
  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Resposta</h2>
        <p className="tab-subtitle">Defina quando o Hades também deve falar a resposta.</p>
      </div>

      <div className="section-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} /> Texto
        </span>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Sempre exibir texto no MiniChat</div>
          <div className="setting-desc">A resposta textual permanece sempre visível no histórico do MiniChat.</div>
        </div>
        <div className="setting-control">
          <label className="switch" aria-label="Sempre exibir texto no MiniChat">
            <input type="checkbox" checked disabled readOnly />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="section-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={16} /> Voz
        </span>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Responder áudio com áudio</div>
          <div className="setting-desc">Quando a pergunta vier do Alt+V, reproduz a resposta em voz além do texto.</div>
        </div>
        <div className="setting-control">
          <label className="switch" aria-label="Responder áudio com áudio">
            <input
              type="checkbox"
              checked={settings.audioForVoiceInput}
              onChange={(e) => updateSettings({ audioForVoiceInput: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Sempre responder com áudio</div>
          <div className="setting-desc">Reproduz TTS em todas as respostas, inclusive perguntas digitadas.</div>
        </div>
        <div className="setting-control">
          <label className="switch" aria-label="Sempre responder com áudio">
            <input
              type="checkbox"
              checked={settings.alwaysAudio}
              onChange={(e) => updateSettings({ alwaysAudio: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ResponseTab;
