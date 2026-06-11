import Phaser from 'phaser';
import { Entity } from './entity';
import { FRAME, TINT } from '../config/sprites';
import { SCORE_COIN } from '../config/game';

export type BlockContent = 'coin' | 'mushroom' | 'fire-flower' | 'star';

/**
 * 問號磚：從下方頂撞吐出內容物後變空磚。
 * 內容物為 power-up 時發 'power-up-spawn' 事件，由 LevelScene 生成實體。
 */
export class QuestionBlock extends Entity {
  private used = false;
  readonly content: BlockContent;

  constructor(scene: Phaser.Scene, x: number, y: number, content: BlockContent) {
    super(scene, x, y, FRAME.QUESTION_BLOCK, TINT.QUESTION);
    this.content = content;
    this.arcade.setAllowGravity(false);
    this.arcade.setImmovable(true);
  }

  /** 從下方被頂撞 */
  hit(): void {
    if (this.used) {
      this.scene.sound.play('sfx-bump', { volume: 0.4 });
      return;
    }
    this.used = true;
    this.setFrame(FRAME.QUESTION_EMPTY);
    this.clearTint();
    this.bounce();

    if (this.content === 'coin') {
      this.scene.sound.play('sfx-coin', { volume: 0.5 });
      this.scene.events.emit('coin-collected', { value: SCORE_COIN });
      this.coinPopEffect();
    } else {
      this.scene.sound.play('sfx-power-up-spawn', { volume: 0.5 });
      this.scene.events.emit('power-up-spawn', {
        type: this.content,
        x: this.x,
        y: this.y - 16,
      });
    }
  }

  private bounce(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 4,
      duration: 60,
      yoyo: true,
    });
  }

  private coinPopEffect(): void {
    const coin = this.scene.add.image(this.x, this.y - 16, this.texture.key, FRAME.COIN);
    coin.setTint(TINT.COIN);
    this.scene.tweens.add({
      targets: coin,
      y: coin.y - 24,
      alpha: 0,
      duration: 300,
      onComplete: () => coin.destroy(),
    });
  }
}
