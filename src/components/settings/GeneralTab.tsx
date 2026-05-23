import React, { useState } from 'react';
import { PlatformFeatureSummary, SettingsData } from '../../types/electron';
import {
  DEFAULT_OPENAI_MODELS,
  ModelDefinition,
  getChatModels,
  getDefaultChatModel,
  getModelsByType,
  isModelType
} from '../../constants/models';
import { Eye, EyeOff, Key, Cpu, Shield, Moon } from 'lucide-react';

interface GeneralTabProps {
  settings: SettingsData['general'];
  updateSettings: (updates: Partial<SettingsData['general']>) => void;
  platformCapabilities?: PlatformFeatureSummary | null;
}

interface SecretInputProps {
  label: string;
  placeholder: string;
  value: string;
  isVisible: boolean;
  onToggleVisible: () => void;
  onChange: (value: string) => void;
}

const SecretInput: React.FC<SecretInputProps> = ({
  label,
  placeholder,
  value,
  isVisible,
  onToggleVisible,
  onChange
}) => (
  <div className="setting-control" style={{ position: 'relative' }}>
    <input
      type={isVisible ? 'text' : 'password'}
      className="settings-input"
      aria-label={label}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      spellCheck={false}
      style={{ paddingRight: '40px' }}
    />
    <button
      type="button"
      aria-label={isVisible ? 'Ocultar chave' : 'Mostrar chave'}
      onClick={onToggleVisible}
      style={{
        position: 'absolute',
        right: '10px',
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

const selectValue = (
  currentValue: string | undefined,
  options: ModelDefinition[],
  fallback: string
) => {
  return options.some(model => model.id === currentValue) ? currentValue : fallback;
};

const GeneralTab: React.FC<GeneralTabProps> = ({ settings, updateSettings, platformCapabilities }) => {
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const chatModels = getChatModels();
  const transcribeModels = getModelsByType('transcribe');
  const realtimeModels = getModelsByType('realtime');
  const defaultChatModel = getDefaultChatModel();

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Configurações</h2>
        <p className="tab-subtitle">Ajuste modelos de IA, privacidade e chaves de acesso.</p>
      </div>

      <div className="section-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={16} /> Chaves de API
        </span>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">OpenAI API Key</div>
          <div className="setting-desc">Usada pelo MiniChat, transcrição, Dreaming e modelos realtime.</div>
        </div>
        <SecretInput
          label="API Key da OpenAI"
          placeholder="Insira sua API Key da OpenAI..."
          value={settings.openaiApiKey}
          isVisible={showOpenAIKey}
          onToggleVisible={() => setShowOpenAIKey(!showOpenAIKey)}
          onChange={(value) => updateSettings({ openaiApiKey: value })}
        />
      </div>

      <div className="section-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} /> Modelos em Uso
        </span>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Modelo do Minichat (Raciocínio)</div>
        </div>
        <div className="setting-control">
          <select 
            className="settings-select"
            aria-label="Modelo do Minichat"
            value={selectValue(settings.minichatModel, chatModels, defaultChatModel)}
            onChange={(e) => updateSettings({ minichatModel: e.target.value })}
          >
            {chatModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Gravador (Speech-to-Text)</div>
        </div>
        <div className="setting-control">
          <select 
            className="settings-select"
            aria-label="Modelo do Gravador de Voz"
            value={selectValue(settings.sttModel, transcribeModels, DEFAULT_OPENAI_MODELS.sttModel)}
            onChange={(e) => updateSettings({ sttModel: e.target.value })}
          >
            {transcribeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Transcrição Completa</div>
        </div>
        <div className="setting-control">
          <select 
            className="settings-select"
            aria-label="Modelo de Transcrição Completa"
            value={selectValue(settings.fullTranscriptionModel, transcribeModels, DEFAULT_OPENAI_MODELS.fullTranscriptionModel)}
            onChange={(e) => updateSettings({ fullTranscriptionModel: e.target.value })}
          >
            {transcribeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Realtime / Susurro futuro</div>
        </div>
        <div className="setting-control">
          <select
            className="settings-select"
            aria-label="Modelo Realtime"
            value={selectValue(settings.realtimeModel, realtimeModels, DEFAULT_OPENAI_MODELS.realtimeModel)}
            onChange={(e) => updateSettings({ realtimeModel: e.target.value })}
          >
            {realtimeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="section-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} /> Privacidade
        </span>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Stealth Mode (Modo Furtivo)</div>
          <div className="setting-desc">Esse modo esconde o aplicativo de gravadores de telas como Discord, OBS e outros.</div>
          {platformCapabilities?.contentProtection?.supported === false && (
            <div className="setting-desc" style={{ color: '#fca5a5', marginTop: '6px' }}>
              Stealth mode não é suportado neste ambiente. No Linux, a janela pode aparecer em capturas de tela.
            </div>
          )}
        </div>
        <div className="setting-control">
          <label className="switch" aria-label="Stealth Mode">
            <input 
              type="checkbox" 
              aria-label="Stealth Mode"
              checked={settings.stealthMode}
              onChange={(e) => updateSettings({ stealthMode: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="section-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Moon size={16} /> Sistema de Dreaming (Memória e Aprendizado)
        </span>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Ativar Dreaming</div>
          <div className="setting-desc">Permite que o Hades consolide aprendizados das conversas e interações em segundo plano.</div>
        </div>
        <div className="setting-control">
          <label className="switch" aria-label="Ativar Dreaming">
            <input 
              type="checkbox" 
              aria-label="Ativar Dreaming"
              checked={settings.dreamingEnabled ?? true}
              onChange={(e) => updateSettings({ dreamingEnabled: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Modelo do Dreaming</div>
          <div className="setting-desc">Escolha o modelo que processará os diários de sessões para gerar novas memórias.</div>
        </div>
        <div className="setting-control">
          <select 
            className="settings-select"
            aria-label="Modelo do Dreaming"
            value={selectValue(settings.dreamingModel, chatModels, defaultChatModel)}
            onChange={(e) => updateSettings({ dreamingModel: e.target.value })}
            disabled={!(settings.dreamingEnabled ?? true)}
          >
            {chatModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
