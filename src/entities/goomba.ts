import Phaser from 'phaser';
import { Enemy } from './enemy';
import { FRAME, TINT, SHEET_KEY } from '../config/sprites';
import { SCORE_STOMP } from '../config/game';
import type { Player } from './player';

const WALK_ANIM = 'goomba-walk';

export class Goomba extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FRAME.GOOMBA_WALK_0, TINT.GOOMBA);
    this.arcade.setSize(14, 14).setOffset(1, 2);

    if (!scene.anims.exists(WALK_ANIM)) {
      scene.anims.create({
        key: WALK_ANIM,
        frames: scene.anims.generateFrameNumbers(SHEET_KEY, {
          frames: [FRAME.GOOMBA_WALK_0, FRAME.GOOMBA_WALK_1],
        }),
        frameRate: 6,
        repeat: -1,
      });
    }
    this.anims.play(WALK_ANIM);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.patrol();
  }

  onStomp(player: Player): void {
    if (this.dead) return;
    this.dead = true;
    this.anims.stop();
    this.arcade.enable = false;
    this.scene.sound.play('sfx-stomp', { volume: 0.5 });
    this.scene.events.emit('enemy-stomped', { score: SCORE_STOMP });
    player.bounceOffEnemy();
    // 壓扁
    this.setScale(1, 0.5);
    this.y += 4;
    this.scene.time.delayedCall(300, () => this.destroy());
  }
}
