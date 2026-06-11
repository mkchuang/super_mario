import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';
import { SaveManager } from '../state/save-manager';
import type { GameState } from '../state/game-state';

/** Game Over：記錄高分 → 回標題 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('game-over');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    const gs = this.registry.get('gameState') as GameState;
    const score = gs?.snapshot.score ?? 0;
    new SaveManager(window.localStorage).recordProgress(0, score);

    this.add
      .text(GAME_WIDTH / 2, 90, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ff6b6b',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 120, `SCORE ${String(score).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 48, 'PRESS Z FOR TITLE', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9be7ff',
      })
      .setOrigin(0.5);

    const go = (): void => {
      this.scene.start('title');
    };
    const kb = this.input.keyboard;
    if (kb) {
      for (const key of ['keydown-Z', 'keydown-ENTER', 'keydown-SPACE']) kb.once(key, go);
    }
    this.time.delayedCall(5000, go);
  }
}
