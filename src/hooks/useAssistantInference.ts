import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../types';
import { ChatMessageOptions } from '../types/electron';
import { buildHadesContext, getHadesSystemPrompt } from '../constants/prompts';
import { electronService } from '../services/electron';
import { playAudioDataUrlWithWebAudio, speakWithSystemVoice } from '../utils/speechPlayback';

export const useAssistantInference = (
  currentModel: string,
  addMessage: (text: string, sender: 'user' | 'ia', image?: string) => ChatMessage[]
) => {
  const [isThinking, setIsThinking] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const speechPlaybackRef = useRef<{ context?: AudioContext; source?: AudioBufferSourceNode } | null>(null);

  const handleAIResponse = useCallback(async (
    userMsgText: string,
    currentHistory: ChatMessage[],
    options: ChatMessageOptions = {}
  ): Promise<number> => {
    setIsThinking(true);

    try {
      const skillsResp = await electronService.listSkills();
      const activeSkills = skillsResp && Array.isArray(skillsResp) && skillsResp.length > 0
        ? `[${skillsResp.map((s: any) => s.name).join(', ')}]`
        : 'Nenhuma skill disponível.';
      const learnings = await electronService.getLearnings();
      const ctx = buildHadesContext(activeSkills, learnings);
      const systemPrompt = getHadesSystemPrompt(ctx);

      const needsWeb = /(pesquis|busc|not[íi]cia|google|site|web|link|url|resum|leia|youtube)/i.test(userMsgText);
      if (needsWeb) {
        setActiveTool('web_search');
      }

      const result = await electronService.assistantGenerateResponse({
        message: userMsgText,
        history: currentHistory,
        systemPrompt,
        model: currentModel,
        enableWebSearch: needsWeb
      });

      if (result.totalTokens) {
        await electronService.updateTokens(result.totalTokens);
      }

      if (result.text) {
        addMessage(result.text, 'ia');
        if (options.speakResponse) {
          electronService.logRendererDiagnostic('VoiceTTS', 'speakResponse enabled', {
            chars: result.text.length
          });
          try {
            const speech = await electronService.synthesizeSpeech(result.text);
            electronService.logRendererDiagnostic('VoiceTTS', 'synthesizeSpeech returned', {
              hasAudio: Boolean(speech?.audioDataUrl),
              model: speech?.model,
              voice: speech?.voice,
              format: speech?.format,
              dataUrlChars: speech?.audioDataUrl?.length || 0
            });
            if (speech?.audioDataUrl) {
              speechPlaybackRef.current?.source?.stop();
              speechPlaybackRef.current?.context?.close();

              const playback = await playAudioDataUrlWithWebAudio(speech.audioDataUrl);
              speechPlaybackRef.current = playback;
              electronService.logRendererDiagnostic('VoiceTTS', 'web audio started', {
                duration: playback.duration,
                state: playback.context.state
              });
              playback.source.onended = () => {
                electronService.logRendererDiagnostic('VoiceTTS', 'web audio ended', {
                  duration: playback.duration
                });
                playback.context.close();
                if (speechPlaybackRef.current === playback) {
                  speechPlaybackRef.current = null;
                }
              };
            } else {
              throw new Error('Speech synthesis returned no audio data.');
            }
          } catch (speechErr) {
            console.error('[useAssistantInference] Speech playback error:', speechErr);
            electronService.logRendererDiagnostic('VoiceTTS', 'audio playback failed', {
              message: speechErr instanceof Error ? speechErr.message : String(speechErr)
            });
            const spokeWithFallback = speakWithSystemVoice(result.text);
            electronService.logRendererDiagnostic('VoiceTTS', 'system speech fallback attempted', {
              success: spokeWithFallback
            });
            if (!spokeWithFallback) {
              console.error('[useAssistantInference] System speech fallback is unavailable.');
            }
          }
        }
      } else {
        addMessage('Erro: resposta vazia da OpenAI.', 'ia');
      }

      try {
        await electronService.logSession({
          timestamp: new Date().toISOString(),
          messages: [...currentHistory, { text: userMsgText, role: 'user' }, { text: result.text, role: 'ia' }],
          toolCalls: needsWeb ? [{ name: 'web_search_preview', args: { enabled: true }, success: true }] : [],
          totalTokens: result.totalTokens || 0,
          skillsUsed: []
        });
      } catch (logErr) {
        console.error('Erro ao fazer log da sessão', logErr);
      }

      return result.totalTokens || 0;
    } catch (error: any) {
      console.error('[useAssistantInference] Inference error:', error);
      addMessage(`Erro: ${error.message}`, 'ia');
      return 0;
    } finally {
      setIsThinking(false);
      setActiveTool(null);
    }
  }, [currentModel, addMessage]);

  return {
    isThinking,
    activeTool,
    handleAIResponse
  };
};
