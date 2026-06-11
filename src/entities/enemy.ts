import Phaser from 'phaser';
import { Entity } from './entity';
import { TILE_SIZE, SCORE_STOMP } from '../config/game';
import type { Player } from './player';

/**
 * 敵人基底：直線巡邏、碰牆轉向、（可選）平台邊緣轉向。
 * 子類實作 onStomp / 自身視覺。
 */
export abstract class Enemy extends Entity {
  protected dir: -1 | 1 = -1;
  protected speed = 30;
  protected dead = false;
  /** Tiled property edgeTurn=true 時不走出平台邊緣 */
  edgeTurn = false;
  private terrain?: Phaser.Tilemaps.TilemapLayer;

  bindTerrain(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.terrain = layer;
  }

  protected patrol(): void {
    if (this.dead) return;
    const body = this.arcade;
    if (body.blocked.left) this.dir = 1;
    else if (body.blocked.right) this.dir = -1;

    if (this.edgeTurn && body.blocked.down && this.terrain) {
      // 前緣下方無碰撞 tile → 轉向
      const aheadX = this.x + this.dir * (TILE_SIZE / 2 + 1);
      const tile = this.terrain.getTileAtWorldXY(aheadX, this.y + TILE_SIZE);
      if (!tile?.collides) this.dir = (this.dir * -1) as -1 | 1;
    }

    body.setVelocityX(this.dir * this.speed);
    this.setFlipX(this.dir > 0);
  }

  get isDead(): boolean {
    return this.dead;
  }

  /** 被踩踏 */
  abstract onStomp(player: Player): void;

  /** 被火球/龜殼/無敵星消滅 */
  defeat(): void {
    if (this.dead) return;
    this.dead = true;
    this.arcade.enable = false;
    this.scene.events.emit('enemy-stomped', { score: SCORE_STOMP });
    // 翻面落下
    this.setFlipY(true);
    this.scene.tweens.add({
      targets: this,
      y: this.y + 80,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
