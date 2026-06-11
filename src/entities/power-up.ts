import Phaser from 'phaser';
import { Entity } from './entity';
import { FRAME, TINT } from '../config/sprites';
import type { BlockContent } from './question-block';

export type PowerUpType = Exclude<BlockContent, 'coin'>;

const VISUAL: Record<PowerUpType, { frame: number; tint: number }> = {
  mushroom: { frame: FRAME.MUSHROOM, tint: TINT.MUSHROOM },
  'fire-flower': { frame: FRAME.FIRE_FLOWER, tint: TINT.FIRE_FLOWER },
  star: { frame: FRAME.STAR, tint: TINT.STAR },
};

/** 道具：蘑菇移動、火花靜止、星星彈跳；從磚塊浮出後啟用物理 */
export class PowerUp extends Entity {
  readonly powerUpType: PowerUpType;
  private emerged = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y + 8, VISUAL[type].frame, VISUAL[type].tint);
    this.powerUpType = type;
    this.arcade.enable = false;
    this.setDepth(-1); // 浮出時藏在磚塊後

    // 浮出動畫
    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 400,
      onComplete: () => this.activate(),
    });
  }

  private activate(): void {
    this.emerged = true;
    this.setDepth(0);
    this.arcade.enable = true;
    if (this.powerUpType === 'mushroom') {
      this.arcade.setVelocityX(40);
      this.arcade.setBounce(1, 0); // 碰牆反向
    } else if (this.powerUpType === 'star') {
      this.arcade.setVelocityX(60);
      this.arcade.setBounce(1, 0.85); // 彈跳前進
    } else {
      this.arcade.setAllowGravity(false);
      this.arcade.setImmovable(true);
    }
  }

  get collectable(): boolean {
    return this.emerged;
  }
}
