import Phaser from 'phaser';
import { Enemy } from './enemy';
import { FRAME, TINT, SHEET_KEY } from '../config/sprites';
import { SCORE_STOMP } from '../config/game';
import type { Player } from './player';

const WALK_ANIM = 'koopa-walk';
const SHELL_SPEED = 280;
/** 縮殼後自動復原時間（經典：滑行中不復原） */
const SHELL_RECOVER_MS = 8000;

export type KoopaState = 'walk' | 'shell-idle' | 'shell-slide';

export class Koopa extends Enemy {
  private koopaState: KoopaState = 'walk';
  private recoverTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FRAME.KOOPA_WALK_0, TINT.KOOPA);
    this.arcade.setSize(14, 14).setOffset(1, 2);

    if (!scene.anims.exists(WALK_ANIM)) {
      scene.anims.create({
        key: WALK_ANIM,
        frames: scene.anims.generateFrameNumbers(SHEET_KEY, {
          frames: [FRAME.KOOPA_WALK_0, FRAME.KOOPA_WALK_1],
        }),
        frameRate: 6,
        repeat: -1,
      });
    }
    this.anims.play(WALK_ANIM);
  }

  // 注意：不可命名為 state（與 Phaser.GameObject.state 衝突）
  get shellState(): KoopaState {
    return this.koopaState;
  }

  get isSliding(): boolean {
    return this.koopaState === 'shell-slide';
  }

  get isIdleShell(): boolean {
    return this.koopaState === 'shell-idle';
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.koopaState === 'walk') {
      this.patrol();
    } else if (this.koopaState === 'shell-slide') {
      // 滑行：碰牆反彈
      const body = this.arcade;
      if (body.blocked.left) body.setVelocityX(SHELL_SPEED);
      else if (body.blocked.right) body.setVelocityX(-SHELL_SPEED);
    }
  }

  onStomp(player: Player): void {
    if (this.dead) return;
    player.bounceOffEnemy();
    if (this.koopaState === 'walk') {
      this.toShellIdle();
    } else if (this.koopaState === 'shell-slide') {
      this.toShellIdle(); // 踩住滑行殼 → 停下
    } else {
      this.kick(player.x);
    }
  }

  /** 側面碰到靜止殼 → 踢出 */
  kick(fromX: number): void {
    if (this.dead) return;
    this.koopaState = 'shell-slide';
    this.recoverTimer?.remove();
    this.scene.sound.play('sfx-stomp', { volume: 0.4 });
    this.arcade.setVelocityX(this.x < fromX ? -SHELL_SPEED : SHELL_SPEED);
  }

  private toShellIdle(): void {
    this.koopaState = 'shell-idle';
    this.anims.stop();
    this.setFrame(FRAME.KOOPA_SHELL);
    this.arcade.setVelocityX(0);
    this.scene.sound.play('sfx-stomp', { volume: 0.5 });
    this.scene.events.emit('enemy-stomped', { score: SCORE_STOMP });
    this.recoverTimer?.remove();
    this.recoverTimer = this.scene.time.delayedCall(SHELL_RECOVER_MS, () => {
      if (this.koopaState === 'shell-idle' && !this.dead) {
        this.koopaState = 'walk';
        this.anims.play(WALK_ANIM);
      }
    });
  }
}
