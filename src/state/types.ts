/** 玩家形態：小 / 大（蘑菇）/ 火力（火花） */
export type PowerState = 'small' | 'super' | 'fire';

/** 跨場景遊戲狀態（由 GameState 管理） */
export interface GameStateData {
  score: number;
  coins: number;
  lives: number;
  /** 0-based，對應 config/levels.ts 的 LEVEL_LIST */
  levelIndex: number;
  powerState: PowerState;
}

/** localStorage 持久化格式（key: SAVE_KEY） */
export interface SaveData {
  unlockedLevelIndex: number;
  highScore: number;
}
