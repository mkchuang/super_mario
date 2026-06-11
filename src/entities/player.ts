import Phaser from 'phaser';
import { Entity } from './entity';
import { FRAME, TINT, SHEET_KEY } from '../config/sprites';
import {
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  STOMP_BOUNCE_VELOCITY,
} from '../config/physics';
import { DAMAGE_INVULN_MS, STAR_DURATION_MS, SCORE_POWER_UP } from '../config/game';
import type { PowerUpType } from './power-up';
import {
  stepHorizontal,
  shouldJump,
  applyJumpCutoff,
  tickTimer,
} from '../systems/movement';
import type { InputSystem } from '../systems/input';
import type { PowerState } from '../state/types';

const WALK_ANIM = 'player-walk';

/** 玩家：input → movement 純函數 → Arcade body */
export class Player extends Entity {
  /** 形態狀態機完整實作於 TASK-012；目前供磚塊互動判斷 */
  powerState: PowerState = 'small';
  private coyoteMsLeft = 0;
  private jumpBufferMsLeft = 0;
  /** 本次跳躍是否已套用 cutoff（每次跳躍只截斷一次） */
  private jumpCutApplied = true;
  private invulnMsLeft = 0;
  private starMsLeft = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FRAME.PLAYER_IDLE, TINT.PLAYER_SMALL);
    this.arcade.setSize(12, 14).setOffset(2, 2);
    this.arcade.setMaxVelocityY(MAX_FALL_SPEED);
    this.setCollideWorldBounds(true);

    if (!scene.anims.exists(WALK_ANIM)) {
      scene.anims.create({
        key: WALK_ANIM,
        frames: scene.anims.generateFrameNumbers(SHEET_KEY, {
          frames: [FRAME.PLAYER_WALK_0, FRAME.PLAYER_WALK_1, FRAME.PLAYER_WALK_2, FRAME.PLAYER_WALK_3],
        }),
        frameRate: 12,
        repeat: -1,
      });
    }
  }

  handleInput(input: InputSystem, dtMs: number): void {
    const sampled = input.sample();
    const body = this.arcade;
    const onGround = body.blocked.down;

    // 計時器：著地重置 coyote；按跳重置 buffer
    this.coyoteMsLeft = onGround ? COYOTE_TIME_MS : tickTimer(this.coyoteMsLeft, dtMs);
    this.jumpBufferMsLeft = sampled.jumpPressed
      ? JUMP_BUFFER_MS
      : tickTimer(this.jumpBufferMsLeft, dtMs);

    // 水平：純函數計算下一幀速度
    body.setVelocityX(stepHorizontal(body.velocity.x, sampled, dtMs));

    // 起跳（coyote + buffer）
    if (shouldJump(this.coyoteMsLeft, this.jumpBufferMsLeft)) {
      body.setVelocityY(JUMP_VELOCITY);
      this.coyoteMsLeft = 0;
      this.jumpBufferMsLeft = 0;
      this.jumpCutApplied = false;
      this.scene.sound.play('sfx-jump', { volume: 0.5 });
    }

    // 可變跳躍高度：放開跳躍鍵時只截斷一次
    if (!this.jumpCutApplied && !sampled.jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(applyJumpCutoff(body.velocity.y, sampled.jumpHeld));
      this.jumpCutApplied = true;
    }

    // 受傷無敵：計時 + 閃爍
    if (this.invulnMsLeft > 0) {
      this.invulnMsLeft = tickTimer(this.invulnMsLeft, dtMs);
      this.setAlpha(Math.floor(this.invulnMsLeft / 80) % 2 === 0 ? 1 : 0.3);
      if (this.invulnMsLeft === 0) this.setAlpha(1);
    }

    // 無敵星：計時 + tint 循環
    if (this.starMsLeft > 0) {
      this.starMsLeft = tickTimer(this.starMsLeft, dtMs);
      const cycle = [0xffffff, 0xffd84d, 0x9be7ff, 0xff7043];
      this.setTint(cycle[Math.floor(Date.now() / 80) % cycle.length]!);
      if (this.starMsLeft === 0) this.applyFormTint();
    }

    this.updateVisual(onGround, body.velocity.x);
  }

  /** 踩踏敵人後反彈 */
  bounceOffEnemy(): void {
    this.arcade.setVelocityY(STOMP_BOUNCE_VELOCITY);
    this.jumpCutApplied = true; // 反彈不受跳躍鍵 cutoff 影響
  }

  get isInvulnerable(): boolean {
    return this.invulnMsLeft > 0;
  }

  get isStarActive(): boolean {
    return this.starMsLeft > 0;
  }

  get facing(): -1 | 1 {
    return this.flipX ? -1 : 1;
  }

  /**
   * 受傷：fire→super→small 降級；small → 死亡。
   * 回傳是否實際受傷（無敵/星星期間回傳 false）。
   */
  takeDamage(): boolean {
    if (this.invulnMsLeft > 0 || this.starMsLeft > 0) return false;
    if (this.powerState === 'small') {
      this.scene.sound.play('sfx-die', { volume: 0.6 });
      this.scene.events.emit('player-died');
      return true;
    }
    this.setPowerState(this.powerState === 'fire' ? 'super' : 'small');
    this.invulnMsLeft = DAMAGE_INVULN_MS;
    this.scene.sound.play('sfx-damage', { volume: 0.5 });
    return true;
  }

  /** 收集道具 */
  applyPowerUp(type: PowerUpType): void {
    if (type === 'star') {
      this.starMsLeft = STAR_DURATION_MS;
      this.scene.sound.play('sfx-star', { volume: 0.5 });
    } else if (this.powerState === 'small') {
      this.setPowerState('super'); // 蘑菇與火花對 small 都是升級為 super
      this.scene.sound.play('sfx-power-up', { volume: 0.5 });
    } else if (type === 'fire-flower' && this.powerState === 'super') {
      this.setPowerState('fire');
      this.scene.sound.play('sfx-power-up', { volume: 0.5 });
    } else {
      this.scene.sound.play('sfx-coin', { volume: 0.5 }); // 重複道具換分數
    }
    this.scene.events.emit('power-up-collected', { type, score: SCORE_POWER_UP });
  }

  /** 形態切換：tint + hitbox（super/fire 高 22px，small 14px） */
  private setPowerState(next: PowerState): void {
    const grow = this.powerState === 'small' && next !== 'small';
    const shrink = this.powerState !== 'small' && next === 'small';
    this.powerState = next;
    this.applyFormTint();
    if (grow) {
      this.setScale(1, 1.5);
      this.arcade.setSize(12, 15).setOffset(2, 1); // ×1.5 → 世界座標 12×22.5
      this.y -= 4;
    } else if (shrink) {
      this.setScale(1, 1);
      this.arcade.setSize(12, 14).setOffset(2, 2);
    }
    this.scene.events.emit('player-power-changed', { powerState: next });
  }

  private applyFormTint(): void {
    const tint =
      this.powerState === 'fire'
        ? TINT.PLAYER_FIRE
        : this.powerState === 'super'
          ? TINT.PLAYER_SUPER
          : TINT.PLAYER_SMALL;
    this.setTint(tint);
  }

  private updateVisual(onGround: boolean, vx: number): void {
    if (vx !== 0) this.setFlipX(vx < 0);
    if (!onGround) {
      this.anims.stop();
      this.setFrame(FRAME.PLAYER_JUMP);
    } else if (Math.abs(vx) > 5) {
      this.anims.play(WALK_ANIM, true);
    } else {
      this.anims.stop();
      this.setFrame(FRAME.PLAYER_IDLE);
    }
  }
}
