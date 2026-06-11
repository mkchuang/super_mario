import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCORE_TIME_BONUS_PER_SEC } from '../config/game';
import { LEVEL_LIST } from '../config/levels';
import { SaveManager } from '../state/save-manager';
import type { GameState } from '../state/game-state';

const STYLE = { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' };

interface CompleteData {
  timeLeft: number;
}

/** 過關結算：時間獎勵 → 下一關或全破 */
export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('level-complete');
  }

  create(data: CompleteData): void {
    this.cameras.main.setBackgroundColor(0x0d2818);
    const gs = this.registry.get('gameState') as GameState;
    const finishedIndex = gs.snapshot.levelIndex;
    const bonus = gs.applyTimeBonus(data.timeLeft, SCORE_TIME_BONUS_PER_SEC);
    const hasNext = gs.advanceLevel(LEVEL_LIST.length);

    // 存檔：解鎖下一關（全破則維持最後一關）與高分
    new SaveManager(window.localStorage).recordProgress(
      Math.min(finishedIndex + 1, LEVEL_LIST.length - 1),
      gs.snapshot.score,
    );

    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, 70, hasNext ? 'LEVEL CLEAR!' : 'ALL CLEAR! THANK YOU!', {
        ...STYLE,
        fontSize: '14px',
        color: '#ffd84d',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 100, `TIME BONUS  ${bonus}`, STYLE)
      .setOrigin(0.5);
    this.add
      .text(cx, 116, `SCORE  ${String(gs.snapshot.score).padStart(6, '0')}`, STYLE)
      .setOrigin(0.5);
    this.add
      .text(cx, GAME_HEIGHT - 48, hasNext ? 'PRESS Z TO CONTINUE' : 'PRESS Z FOR TITLE', {
        ...STYLE,
        color: '#9be7ff',
      })
      .setOrigin(0.5);

    const go = (): void => {
      if (hasNext) {
        this.scene.start('level', { level: LEVEL_LIST[gs.snapshot.levelIndex] });
      } else {
        this.scene.start('title');
      }
    };
    const kb = this.input.keyboard;
    if (kb) {
      for (const key of ['keydown-Z', 'keydown-ENTER', 'keydown-SPACE']) kb.once(key, go);
    }
    this.time.delayedCall(6000, go); // 無輸入時自動前進
  }
}
