import { describe, it, expect } from 'vitest';
import {
  stepHorizontal,
  shouldJump,
  applyJumpCutoff,
  tickTimer,
  type MovementInput,
} from '../src/systems/movement';
import {
  RUN_SPEED_MAX,
  RUN_ACCEL,
  RUN_DECEL,
  JUMP_CUTOFF_FACTOR,
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
} from '../src/config/physics';

const input = (partial: Partial<MovementInput>): MovementInput => ({
  left: false,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
  ...partial,
});

const DT = 16.67; // 60fps 單幀

describe('movement.stepHorizontal', () => {
  it('按住右鍵_持續加速並封頂於 RUN_SPEED_MAX', () => {
    let vx = 0;
    for (let i = 0; i < 600; i++) vx = stepHorizontal(vx, input({ right: true }), DT);
    expect(vx).toBe(RUN_SPEED_MAX);
  });

  it('單幀加速量_等於 RUN_ACCEL × dt', () => {
    const vx = stepHorizontal(0, input({ right: true }), 100);
    expect(vx).toBeCloseTo(RUN_ACCEL * 0.1, 5);
  });

  it('鬆鍵_減速到 0 後維持 0 不抖動', () => {
    let vx = RUN_SPEED_MAX;
    for (let i = 0; i < 600; i++) vx = stepHorizontal(vx, input({}), DT);
    expect(vx).toBe(0);
  });

  it('鬆鍵減速_不會越過 0 變成反向', () => {
    const vx = stepHorizontal(5, input({}), 100); // 減速量 100 > 5
    expect(vx).toBe(0);
  });

  it('反向輸入_使用 RUN_DECEL 煞車', () => {
    const vx = stepHorizontal(RUN_SPEED_MAX, input({ left: true }), 100);
    expect(vx).toBeCloseTo(RUN_SPEED_MAX - RUN_DECEL * 0.1, 5);
  });

  it('左鍵_對稱地封頂於 -RUN_SPEED_MAX', () => {
    let vx = 0;
    for (let i = 0; i < 600; i++) vx = stepHorizontal(vx, input({ left: true }), DT);
    expect(vx).toBe(-RUN_SPEED_MAX);
  });
});

describe('movement.shouldJump（coyote + buffer 邊界）', () => {
  it('coyote 79ms 剩餘 + buffer 有效_可起跳', () => {
    expect(shouldJump(79, 1)).toBe(true);
  });

  it('coyote 歸零（離地超過 80ms）_不可起跳', () => {
    expect(shouldJump(0, JUMP_BUFFER_MS)).toBe(false);
  });

  it('buffer 歸零（按跳超過 100ms 才落地）_不可起跳', () => {
    expect(shouldJump(COYOTE_TIME_MS, 0)).toBe(false);
  });

  it('coyote 邊界_80ms 計時經過 81ms 後不可起跳、79ms 後可起跳', () => {
    expect(shouldJump(tickTimer(COYOTE_TIME_MS, 81), 1)).toBe(false);
    expect(shouldJump(tickTimer(COYOTE_TIME_MS, 79), 1)).toBe(true);
  });
});

describe('movement.applyJumpCutoff', () => {
  it('上升中放開跳躍鍵_vy 乘以 JUMP_CUTOFF_FACTOR', () => {
    expect(applyJumpCutoff(-460, false)).toBeCloseTo(-460 * JUMP_CUTOFF_FACTOR, 5);
  });

  it('上升中按住跳躍鍵_vy 不變', () => {
    expect(applyJumpCutoff(-460, true)).toBe(-460);
  });

  it('下落中放開跳躍鍵_vy 不變', () => {
    expect(applyJumpCutoff(100, false)).toBe(100);
  });
});

describe('movement.tickTimer', () => {
  it('遞減後不低於 0', () => {
    expect(tickTimer(10, 20)).toBe(0);
    expect(tickTimer(30, 20)).toBe(10);
  });
});
