import Phaser from 'phaser';
import { Entity } from './entity';
import { FRAME, TINT } from '../config/sprites';
import { SCORE_COIN } from '../config/game';

/** 場景金幣：overlap 收集，發 coin-collected 事件 */
export class Coin extends Entity {
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FRAME.COIN, TINT.COIN);
    this.arcade.setAllowGravity(false);
    this.arcade.setImmovable(true);
  }

  collect(): void {
    if (this.collected) return; // 同一金幣不重複觸發
    this.collected = true;
    this.arcade.enable = false;
    this.scene.sound.play('sfx-coin', { volume: 0.5 });
    this.scene.events.emit('coin-collected', { value: SCORE_COIN });
    // 收集動畫：上飄淡出
    this.scene.tweens.add({
      targets: this,
      y: this.y - 16,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
