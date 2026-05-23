import { describe, expect, it } from 'vitest';
import { updateMessageWithDeltas } from '../../src/utils/transcription';

describe('transcription utils', () => {
  const baseMessage = {
    id: 'msg-1',
    text: '',
    pendingText: '',
    realtimeItemId: 'item_001',
    isTranslated: false,
    isTranslating: false,
    timestamp: new Date('2026-05-21T00:00:00Z'),
    updateCount: 0,
  };

  it('replaces partial text with final realtime transcript instead of appending it', () => {
    const withPartial = updateMessageWithDeltas([baseMessage], 0, [
      { text: 'Hello', isFinal: false, itemId: 'item_001' },
    ]);

    const withFinal = updateMessageWithDeltas(withPartial, 0, [
      { text: 'Hello world', isFinal: true, itemId: 'item_001', replaceText: true },
    ]);

    expect(withFinal[0].text).toBe('Hello world');
    expect(withFinal[0].pendingText).toBe('');
    expect(withFinal[0].realtimeItemId).toBe('item_001');
  });
});
