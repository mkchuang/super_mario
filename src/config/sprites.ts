// tilesheet.png（Kenney 1-Bit Platformer Pack）的 frame 映射。
// spritesheet 為 320×320 = 20×20 個 16×16 tiles；index = row × 20 + col。
// 單色素材，遊戲內以 tint 上色（見 TINT）。

/** spritesheet 載入 key */
export const SHEET_KEY = 'tilesheet';

export const SHEET_COLS = 20;

/** tile / 地形 */
export const FRAME = {
  GROUND: 11,
  QUESTION_BLOCK: 7,
  QUESTION_EMPTY: 9,
  BRICK: 10,

  COIN: 2,
  COIN_SMALL: 1,
  MUSHROOM: 53,
  FIRE_FLOWER: 16,
  STAR: 22, // 鑽石寶石替代星星
  HEART_1UP: 42,

  DOOR_EXIT: 56, // 門替代旗桿（過關觸發點）
  DOOR_OPEN: 58,

  /** 玩家：觸角小機器人（row 13），行走 260-263、跳躍 264 */
  PLAYER_IDLE: 260,
  PLAYER_WALK_0: 260,
  PLAYER_WALK_1: 261,
  PLAYER_WALK_2: 262,
  PLAYER_WALK_3: 263,
  PLAYER_JUMP: 264,

  /** Goomba（圓臉敵人，row 16）；壓扁以 scaleY 表現 */
  GOOMBA_WALK_0: 320,
  GOOMBA_WALK_1: 321,
  GOOMBA_SQUASHED: 320,

  /** Koopa（殼層敵人，row 18） */
  KOOPA_WALK_0: 360,
  KOOPA_WALK_1: 361,
  KOOPA_SHELL: 365,

  /** 小寶石替代火球 */
  FIREBALL: 20,
} as const;

/** 單色素材的 tint 配色 */
export const TINT = {
  PLAYER_SMALL: 0xffffff,
  PLAYER_SUPER: 0xffd84d,
  PLAYER_FIRE: 0xff7043,
  GOOMBA: 0xc97f4e,
  KOOPA: 0x6fd66f,
  COIN: 0xffd84d,
  MUSHROOM: 0xff6b6b,
  FIRE_FLOWER: 0xffa726,
  STAR: 0x9be7ff,
  BRICK: 0xc97f4e,
  QUESTION: 0xffd84d,
  FIREBALL: 0xffa726,
} as const;

/** 各 theme 的地形 tint 與背景色 */
export const THEME_STYLE = {
  overworld: { groundTint: 0x8bc34a, bgColor: 0x2a4d69 },
  underground: { groundTint: 0x7986cb, bgColor: 0x101020 },
  castle: { groundTint: 0x9e9e9e, bgColor: 0x1a1010 },
} as const;
