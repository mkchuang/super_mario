// 手感參數集中於此檔（H5）；調校時只動這裡，不散落在 entity 中。
// 單位：速度 pixels/s、加速度 pixels/s²（Arcade Physics 預設）、時間 ms。

/** 重力加速度（pixels/s²） */
export const GRAVITY_Y = 1200;

/** 水平移動最高速（pixels/s） */
export const RUN_SPEED_MAX = 200;

/** 水平加速度（pixels/s²） */
export const RUN_ACCEL = 800;

/** 鬆鍵/反向時的減速度（pixels/s²） */
export const RUN_DECEL = 1000;

/** 起跳初速（pixels/s，向上為負） */
export const JUMP_VELOCITY = -460;

/** 放開跳躍鍵時上升速度乘數（無因次）；實現可變跳躍高度 */
export const JUMP_CUTOFF_FACTOR = 0.45;

/** 離地後仍可起跳的寬限時間（ms） */
export const COYOTE_TIME_MS = 80;

/** 落地前預按跳躍的緩衝時間（ms） */
export const JUMP_BUFFER_MS = 100;

/**
 * 最大下落速度（pixels/s）。
 * 必須 < TILE_SIZE × 60fps = 960，保證單幀位移不跨 tile（防穿透，見 ADR-001）。
 */
export const MAX_FALL_SPEED = 600;

/** 踩踏敵人後的反彈初速（pixels/s） */
export const STOMP_BOUNCE_VELOCITY = -260;
