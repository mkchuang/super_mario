import { describe, it, expect } from 'vitest';
import { GameState, createInitialState } from '../src/state/game-state';
import { INITIAL_LIVES, COINS_PER_LIFE, SCORE_COIN } from '../src/config/game';

describe('GameState', () => {
  it('初始狀態_符合預設值', () => {
    expect(createInitialState()).toEqual({
      score: 0,
      coins: 0,
      lives: INITIAL_LIVES,
      levelIndex: 0,
      powerState: 'small',
    });
  });

  it('addCoin_累計金幣與分數', () => {
    const gs = new GameState();
    gs.addCoin(SCORE_COIN);
    expect(gs.snapshot.coins).toBe(1);
    expect(gs.snapshot.score).toBe(SCORE_COIN);
  });

  it('addCoin_滿百進位加命且金幣歸零重計', () => {
    const gs = new GameState({ coins: COINS_PER_LIFE - 1 });
    const oneUp = gs.addCoin(SCORE_COIN);
    expect(oneUp).toBe(true);
    expect(gs.snapshot.coins).toBe(0);
    expect(gs.snapshot.lives).toBe(INITIAL_LIVES + 1);
  });

  it('loseLife_扣命並重置形態_不低於 0', () => {
    const gs = new GameState({ lives: 1, powerState: 'fire' });
    expect(gs.loseLife()).toBe(0);
    expect(gs.snapshot.powerState).toBe('small');
    expect(gs.loseLife()).toBe(0); // 不變負數
  });

  it('advanceLevel_最後一關回傳 false', () => {
    const gs = new GameState({ levelIndex: 3 });
    expect(gs.advanceLevel(5)).toBe(true);
    expect(gs.snapshot.levelIndex).toBe(4);
    expect(gs.advanceLevel(5)).toBe(false);
    expect(gs.snapshot.levelIndex).toBe(4);
  });

  it('applyTimeBonus_剩餘秒數換分', () => {
    const gs = new GameState();
    const bonus = gs.applyTimeBonus(123.9, 50);
    expect(bonus).toBe(123 * 50);
    expect(gs.snapshot.score).toBe(123 * 50);
  });

  it('snapshot_為複本_外部修改不影響內部', () => {
    const gs = new GameState();
    const snap = gs.snapshot as { score: number };
    snap.score = 9999;
    expect(gs.snapshot.score).toBe(0);
  });
});
