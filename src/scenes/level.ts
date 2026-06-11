import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';
import { SHEET_KEY, FRAME, TINT, THEME_STYLE } from '../config/sprites';

/**
 * Gameplay 場景。
 * 目前為 TASK-002 骨架：顯示底色、版本字樣與素材 smoke test；
 * TASK-006/007 將加入 tilemap 與 Player。
 */
export class LevelScene extends Phaser.Scene {
  constructor() {
    super('level');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(THEME_STYLE.overworld.bgColor);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'SUPER MARIO', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 20, 'v0.1.0 — TASK-002', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#9be7ff',
      })
      .setOrigin(0.5);

    // 素材 smoke test：spritesheet 載入正確即可看到上色後的角色與道具
    const frames = [
      { frame: FRAME.PLAYER_IDLE, tint: TINT.PLAYER_SMALL },
      { frame: FRAME.GOOMBA_WALK_0, tint: TINT.GOOMBA },
      { frame: FRAME.KOOPA_WALK_0, tint: TINT.KOOPA },
      { frame: FRAME.COIN, tint: TINT.COIN },
      { frame: FRAME.QUESTION_BLOCK, tint: TINT.QUESTION },
      { frame: FRAME.BRICK, tint: TINT.BRICK },
      { frame: FRAME.MUSHROOM, tint: TINT.MUSHROOM },
      { frame: FRAME.GROUND, tint: THEME_STYLE.overworld.groundTint },
    ];
    frames.forEach(({ frame, tint }, i) => {
      this.add
        .image(GAME_WIDTH / 2 + (i - (frames.length - 1) / 2) * 24, GAME_HEIGHT * 0.65, SHEET_KEY, frame)
        .setTint(tint);
    });
  }
}
