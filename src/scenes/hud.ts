import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/game';
import type { GameStateData } from '../state/types';

const TEXT_STYLE = { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' };

/** HUD overlay：分數/金幣/關卡/時間/生命；訂閱 level 場景事件即時更新 */
export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  constructor() {
    super('hud');
  }

  create(data: { displayName: string }): void {
    const y = 4;
    this.scoreText = this.add.text(8, y, 'SCORE 000000', TEXT_STYLE);
    this.coinText = this.add.text(8, y + 10, 'x00', { ...TEXT_STYLE, color: '#ffd84d' });
    this.add.text(GAME_WIDTH / 2, y, data.displayName ?? '', TEXT_STYLE).setOrigin(0.5, 0);
    this.timeText = this.add.text(GAME_WIDTH - 8, y, 'TIME 000', TEXT_STYLE).setOrigin(1, 0);
    this.livesText = this.add
      .text(GAME_WIDTH - 8, y + 10, 'LIVES 0', { ...TEXT_STYLE, color: '#9be7ff' })
      .setOrigin(1, 0);

    const level = this.scene.get('level');
    level.events.on('hud-refresh', this.refresh, this);
    level.events.on('time-tick', this.onTimeTick, this);

    // HUD 晚於 level 場景啟動，初始值直接從 registry 拉
    const gs = this.registry.get('gameState') as { snapshot: GameStateData } | undefined;
    if (gs) this.refresh(gs.snapshot);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      level.events.off('hud-refresh', this.refresh, this);
      level.events.off('time-tick', this.onTimeTick, this);
    });
  }

  private refresh(snapshot: GameStateData): void {
    this.scoreText.setText(`SCORE ${String(snapshot.score).padStart(6, '0')}`);
    this.coinText.setText(`x${String(snapshot.coins).padStart(2, '0')}`);
    this.livesText.setText(`LIVES ${snapshot.lives}`);
  }

  private onTimeTick(e: { left: number }): void {
    this.timeText.setText(`TIME ${String(Math.max(0, Math.ceil(e.left))).padStart(3, '0')}`);
    this.timeText.setColor(e.left <= 60 ? '#ff6b6b' : '#ffffff');
  }
}
