import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';
import { SHEET_KEY, FRAME, TINT } from '../config/sprites';
import { LEVEL_LIST } from '../config/levels';
import { GameState } from '../state/game-state';
import { SaveManager } from '../state/save-manager';

const ITEM_STYLE = { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' };

/** 標題畫面：開始（第一關）/ 繼續（存檔進度） */
export class TitleScene extends Phaser.Scene {
  private options: { label: string; levelIndex: number }[] = [];
  private cursor = 0;
  private items: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    this.add
      .text(GAME_WIDTH / 2, 56, 'SUPER MARIO', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffd84d',
      })
      .setOrigin(0.5);
    this.add
      .image(GAME_WIDTH / 2, 92, SHEET_KEY, FRAME.PLAYER_IDLE)
      .setTint(TINT.PLAYER_SMALL)
      .setScale(2);

    const save = new SaveManager(window.localStorage).load();
    this.options = [{ label: 'START', levelIndex: 0 }];
    if (save.unlockedLevelIndex > 0 && save.unlockedLevelIndex < LEVEL_LIST.length) {
      this.options.push({
        label: `CONTINUE (${LEVEL_LIST[save.unlockedLevelIndex]!.displayName})`,
        levelIndex: save.unlockedLevelIndex,
      });
    }
    if (save.highScore > 0) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 16, `HI ${String(save.highScore).padStart(6, '0')}`, {
          ...ITEM_STYLE,
          color: '#9be7ff',
        })
        .setOrigin(0.5);
    }

    this.items = this.options.map((opt, i) =>
      this.add.text(GAME_WIDTH / 2, 140 + i * 16, opt.label, ITEM_STYLE).setOrigin(0.5),
    );
    this.renderCursor();

    const kb = this.input.keyboard;
    if (!kb) throw new Error('keyboard plugin 不可用');
    kb.on('keydown-UP', () => this.moveCursor(-1));
    kb.on('keydown-DOWN', () => this.moveCursor(1));
    for (const key of ['keydown-Z', 'keydown-ENTER', 'keydown-SPACE']) {
      kb.on(key, () => this.confirm());
    }
  }

  private moveCursor(d: number): void {
    this.cursor = Phaser.Math.Wrap(this.cursor + d, 0, this.options.length);
    this.renderCursor();
  }

  private renderCursor(): void {
    this.items.forEach((t, i) => {
      t.setColor(i === this.cursor ? '#ffd84d' : '#ffffff');
      t.setText(`${i === this.cursor ? '> ' : '  '}${this.options[i]!.label}`);
    });
  }

  private confirm(): void {
    const opt = this.options[this.cursor]!;
    this.registry.set('gameState', new GameState({ levelIndex: opt.levelIndex }));
    this.scene.start('level', { level: LEVEL_LIST[opt.levelIndex] });
  }
}
