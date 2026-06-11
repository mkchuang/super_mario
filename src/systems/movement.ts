// 手感補強純函數層（ADR-001）：不 import Phaser，entity 經由此層計算速度，
// 保證可單元測試，且物理實作可替換。

import {
  RUN_SPEED_MAX,
  RUN_ACCEL,
  RUN_DECEL,
  JUMP_CUTOFF_FACTOR,
} from '../config/physics';

export interface MovementInput {
  left: boolean;
  right: boolean;
  /** 本幀剛按下跳躍鍵 */
  jumpPressed: boolean;
  /** 跳躍鍵持續按住 */
  jumpHeld: boolean;
}

/**
 * 計算下一幀水平速度：按方向鍵加速（封頂 RUN_SPEED_MAX）、
 * 鬆鍵減速至 0、反向時以減速度先煞車。
 */
export function stepHorizontal(vx: number, input: MovementInput, dtMs: number): number {
  const dt = dtMs / 1000;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  if (dir !== 0) {
    // 反向輸入時先用較大的減速度煞車，手感更跟手
    const accel = Math.sign(vx) !== 0 && Math.sign(vx) !== dir ? RUN_DECEL : RUN_ACCEL;
    const next = vx + dir * accel * dt;
    return Math.max(-RUN_SPEED_MAX, Math.min(RUN_SPEED_MAX, next));
  }

  // 無輸入：朝 0 減速，不越過 0（避免抖動）
  if (vx > 0) return Math.max(0, vx - RUN_DECEL * dt);
  if (vx < 0) return Math.min(0, vx + RUN_DECEL * dt);
  return 0;
}

/**
 * 是否應該起跳：coyote time 內仍算在地面，或落地時 jump buffer 仍有效。
 * 兩個計時器由呼叫端（Player）每幀遞減維護。
 */
export function shouldJump(coyoteMsLeft: number, jumpBufferMsLeft: number): boolean {
  return coyoteMsLeft > 0 && jumpBufferMsLeft > 0;
}

/**
 * 可變跳躍高度：上升中放開跳躍鍵時，垂直速度乘以 JUMP_CUTOFF_FACTOR。
 * 下落中（vy >= 0）或仍按住時不變。
 */
export function applyJumpCutoff(vy: number, jumpHeld: boolean): number {
  if (!jumpHeld && vy < 0) return vy * JUMP_CUTOFF_FACTOR;
  return vy;
}

/** 計時器遞減（不低於 0）；Player 每幀用於 coyote / jump buffer */
export function tickTimer(msLeft: number, dtMs: number): number {
  return Math.max(0, msLeft - dtMs);
}
