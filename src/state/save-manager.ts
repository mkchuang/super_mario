// localStorage 存檔（key: SAVE_KEY，帶版本；格式變更時換新 key + 遷移函數）

import type { SaveData } from './types';
import { SAVE_KEY } from '../config/game';

const DEFAULT_SAVE: SaveData = {
  unlockedLevelIndex: 0,
  highScore: 0,
};

function isValidSave(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.unlockedLevelIndex === 'number' &&
    Number.isInteger(v.unlockedLevelIndex) &&
    v.unlockedLevelIndex >= 0 &&
    typeof v.highScore === 'number' &&
    v.highScore >= 0
  );
}

export class SaveManager {
  constructor(private storage: Pick<Storage, 'getItem' | 'setItem'>) {}

  /** 讀檔；損壞/缺欄位/不存在一律 fallback 預設值，不 crash */
  load(): SaveData {
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed: unknown = JSON.parse(raw);
      if (!isValidSave(parsed)) {
        console.warn('save-manager: 存檔格式不符，使用預設值');
        return { ...DEFAULT_SAVE };
      }
      return { unlockedLevelIndex: parsed.unlockedLevelIndex, highScore: parsed.highScore };
    } catch {
      console.warn('save-manager: 存檔讀取失敗，使用預設值');
      return { ...DEFAULT_SAVE };
    }
  }

  save(data: SaveData): void {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      console.warn('save-manager: 存檔寫入失敗（private mode？）');
    }
  }

  /** 過關/結束時更新進度與高分（只進不退） */
  recordProgress(unlockedLevelIndex: number, score: number): SaveData {
    const current = this.load();
    const next: SaveData = {
      unlockedLevelIndex: Math.max(current.unlockedLevelIndex, unlockedLevelIndex),
      highScore: Math.max(current.highScore, score),
    };
    this.save(next);
    return next;
  }
}
