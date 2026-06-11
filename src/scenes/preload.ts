import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/game';
import { SHEET_KEY } from '../config/sprites';

const SFX_KEYS = [
  'sfx-jump',
  'sfx-coin',
  'sfx-stomp',
  'sfx-power-up',
  'sfx-power-up-spawn',
  'sfx-damage',
  'sfx-die',
  'sfx-level-complete',
  'sfx-brick-break',
  'sfx-fireball',
  'sfx-star',
  'sfx-bump',
  'sfx-one-up',
] as const;

/** 載入全部素材並顯示進度條 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  preload(): void {
    const barWidth = GAME_WIDTH * 0.6;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT / 2;

    const outline = this.add.rectangle(GAME_WIDTH / 2, barY, barWidth + 4, 12);
    outline.setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(barX, barY, 0, 8, 0xffffff).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = barWidth * value;
    });

    this.load.spritesheet(SHEET_KEY, 'sprites/tilesheet.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });

    for (const key of SFX_KEYS) {
      this.load.audio(key, `audio/${key}.ogg`);
    }
  }

  create(): void {
    this.scene.start('level');
  }
}
