// 關卡清單：data-driven，新增關卡只改此檔與 tilemap JSON，不動場景程式碼。

export type LevelTheme = 'overworld' | 'underground' | 'castle';

export interface LevelDefinition {
  key: string;
  tilemapPath: string;
  theme: LevelTheme;
  musicKey: string;
  timeLimitSec: number;
  displayName: string;
}

export const LEVEL_LIST: readonly LevelDefinition[] = [
  {
    key: 'level-1',
    tilemapPath: 'tilemaps/level-1.json',
    theme: 'overworld',
    musicKey: 'bgm-overworld',
    timeLimitSec: 300,
    displayName: 'WORLD 1-1',
  },
  {
    key: 'level-2',
    tilemapPath: 'tilemaps/level-2.json',
    theme: 'overworld',
    musicKey: 'bgm-overworld',
    timeLimitSec: 300,
    displayName: 'WORLD 1-2',
  },
  {
    key: 'level-3',
    tilemapPath: 'tilemaps/level-3.json',
    theme: 'underground',
    musicKey: 'bgm-underground',
    timeLimitSec: 300,
    displayName: 'WORLD 1-3',
  },
  {
    key: 'level-4',
    tilemapPath: 'tilemaps/level-4.json',
    theme: 'castle',
    musicKey: 'bgm-castle',
    timeLimitSec: 300,
    displayName: 'WORLD 1-4',
  },
  {
    key: 'level-5',
    tilemapPath: 'tilemaps/level-5.json',
    theme: 'castle',
    musicKey: 'bgm-castle',
    timeLimitSec: 400,
    displayName: 'WORLD 1-5',
  },
] as const;

/** 手感測試關卡（S1 垂直切片用，不在正式關卡清單內） */
export const TEST_LEVEL: LevelDefinition = {
  key: 'level-0',
  tilemapPath: 'tilemaps/level-0.json',
  theme: 'overworld',
  musicKey: 'bgm-overworld',
  timeLimitSec: 999,
  displayName: 'TEST 0-0',
};
