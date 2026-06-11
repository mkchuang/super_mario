import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveManager } from '../src/state/save-manager';
import { SAVE_KEY } from '../src/config/game';

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('SaveManager', () => {
  it('round-trip_寫入後讀回相同', () => {
    const sm = new SaveManager(memoryStorage());
    sm.save({ unlockedLevelIndex: 3, highScore: 12345 });
    expect(sm.load()).toEqual({ unlockedLevelIndex: 3, highScore: 12345 });
  });

  it('無存檔_回傳預設值', () => {
    const sm = new SaveManager(memoryStorage());
    expect(sm.load()).toEqual({ unlockedLevelIndex: 0, highScore: 0 });
  });

  it('損壞 JSON_fallback 預設值並警告', () => {
    const sm = new SaveManager(memoryStorage({ [SAVE_KEY]: '{not json' }));
    expect(sm.load()).toEqual({ unlockedLevelIndex: 0, highScore: 0 });
    expect(console.warn).toHaveBeenCalled();
  });

  it('缺欄位_fallback 預設值', () => {
    const sm = new SaveManager(memoryStorage({ [SAVE_KEY]: '{"highScore": 100}' }));
    expect(sm.load()).toEqual({ unlockedLevelIndex: 0, highScore: 0 });
  });

  it('欄位型別錯誤_fallback 預設值', () => {
    const sm = new SaveManager(
      memoryStorage({ [SAVE_KEY]: '{"unlockedLevelIndex":"3","highScore":1}' }),
    );
    expect(sm.load()).toEqual({ unlockedLevelIndex: 0, highScore: 0 });
  });

  it('recordProgress_進度與高分只進不退', () => {
    const sm = new SaveManager(memoryStorage());
    sm.recordProgress(2, 5000);
    expect(sm.recordProgress(1, 3000)).toEqual({ unlockedLevelIndex: 2, highScore: 5000 });
    expect(sm.recordProgress(3, 4000)).toEqual({ unlockedLevelIndex: 3, highScore: 5000 });
  });

  it('setItem 拋例外_不 crash 並警告', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceeded');
    };
    const sm = new SaveManager(storage);
    expect(() => sm.save({ unlockedLevelIndex: 0, highScore: 0 })).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });
});
