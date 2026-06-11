// 跨場景遊戲狀態（不 import Phaser；場景透過事件與此模組同步）

import type { GameStateData, PowerState } from './types';
import { INITIAL_LIVES, COINS_PER_LIFE } from '../config/game';

export function createInitialState(levelIndex = 0): GameStateData {
  return {
    score: 0,
    coins: 0,
    lives: INITIAL_LIVES,
    levelIndex,
    powerState: 'small',
  };
}

export class GameState {
  private data: GameStateData;

  constructor(initial?: Partial<GameStateData>) {
    this.data = { ...createInitialState(), ...initial };
  }

  get snapshot(): Readonly<GameStateData> {
    return { ...this.data };
  }

  addScore(value: number): void {
    this.data.score += value;
  }

  /** 收集金幣；滿 COINS_PER_LIFE 進位加命。回傳是否獲得 1-up */
  addCoin(scoreValue: number): boolean {
    this.data.coins += 1;
    this.addScore(scoreValue);
    if (this.data.coins >= COINS_PER_LIFE) {
      this.data.coins -= COINS_PER_LIFE;
      this.data.lives += 1;
      return true;
    }
    return false;
  }

  /** 死亡扣命。回傳剩餘命數（0 = game over） */
  loseLife(): number {
    this.data.lives = Math.max(0, this.data.lives - 1);
    this.data.powerState = 'small';
    return this.data.lives;
  }

  addLife(): void {
    this.data.lives += 1;
  }

  setPowerState(state: PowerState): void {
    this.data.powerState = state;
  }

  /** 進入下一關。回傳 false 表示已是最後一關 */
  advanceLevel(totalLevels: number): boolean {
    if (this.data.levelIndex + 1 >= totalLevels) return false;
    this.data.levelIndex += 1;
    return true;
  }

  /** 過關時間獎勵 */
  applyTimeBonus(secondsLeft: number, scorePerSec: number): number {
    const bonus = Math.max(0, Math.floor(secondsLeft)) * scorePerSec;
    this.addScore(bonus);
    return bonus;
  }
}
