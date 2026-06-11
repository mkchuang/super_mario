import Phaser from 'phaser';
import { Entity } from './entity';
import { FRAME, TINT } from '../config/sprites';

const SPEED_X = 240;
const BOUNCE_VY = -180;
const LIFETIME_MS = 3000;

/** 火球：沿地面彈跳前進，撞牆消失，命中敵人雙方消滅 */
export class Fireball extends Entity {
  constructor(scene: Phaser.Scene, x: number, y: number, dir: -1 | 1) {
    super(scene, x, y, FRAME.FIREBALL, TINT.FIREBALL);
    this.arcade.setSize(8, 8).setOffset(4, 4);
    this.arcade.setVelocityX(dir * SPEED_X);
    scene.sound.play('sfx-fireball', { volume: 0.4 });
    scene.time.delayedCall(LIFETIME_MS, () => {
      if (this.active) this.pop();
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const body = this.arcade;
    if (body.blocked.down) body.setVelocityY(BOUNCE_VY); // 等高彈跳
    if (body.blocked.left || body.blocked.right) this.pop(); // 撞牆消失
    this.rotation += 0.3;
  }

  /** 消失（小爆裂效果） */
  pop(): void {
    if (!this.active) return;
    const puff = this.scene.add
      .image(this.x, this.y, this.texture.key, FRAME.FIREBALL)
      .setTint(0xffffff)
      .setScale(1.2);
    this.scene.tweens.add({
      targets: puff,
      alpha: 0,
      scale: 0.2,
      duration: 150,
      onComplete: () => puff.destroy(),
    });
    this.destroy();
  }
}
