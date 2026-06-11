import Phaser from 'phaser';
import { Entity } from './entity';
import { FRAME, TINT } from '../config/sprites';
import type { PowerState } from '../state/types';

/** 可破壞磚塊：small 頂撞只彈動；super 以上擊碎 */
export class Brick extends Entity {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FRAME.BRICK, TINT.BRICK);
    this.arcade.setAllowGravity(false);
    this.arcade.setImmovable(true);
  }

  /** 從下方被頂撞 */
  hit(powerState: PowerState): void {
    if (powerState === 'small') {
      this.scene.sound.play('sfx-bump', { volume: 0.4 });
      this.scene.tweens.add({ targets: this, y: this.y - 4, duration: 60, yoyo: true });
      return;
    }
    this.shatter();
  }

  private shatter(): void {
    this.scene.sound.play('sfx-brick-break', { volume: 0.5 });
    this.scene.events.emit('brick-broken', { x: this.x, y: this.y });
    // 四塊碎片飛散
    for (const [dx, dy] of [
      [-1, -2],
      [1, -2],
      [-1, -1],
      [1, -1],
    ] as const) {
      const shard = this.scene.add
        .image(this.x, this.y, this.texture.key, FRAME.BRICK)
        .setTint(TINT.BRICK)
        .setScale(0.4);
      this.scene.tweens.add({
        targets: shard,
        x: this.x + dx * 20,
        y: this.y + dy * 18 + 60,
        angle: dx * 180,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeIn',
        onComplete: () => shard.destroy(),
      });
    }
    this.destroy();
  }
}
