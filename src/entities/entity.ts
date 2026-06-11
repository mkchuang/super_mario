import Phaser from 'phaser';
import { SHEET_KEY } from '../config/sprites';

/** Arcade body 的型別收斂 helper */
export function arcadeBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  return sprite.body as Phaser.Physics.Arcade.Body;
}

/**
 * 遊戲實體基底：統一掛載 spritesheet 與 Arcade body 生命週期。
 * 行為差異由子類組合，不做深層繼承。
 */
export abstract class Entity extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, frame: number, tint: number) {
    super(scene, x, y, SHEET_KEY, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(tint);
  }

  get arcade(): Phaser.Physics.Arcade.Body {
    return arcadeBody(this);
  }
}
