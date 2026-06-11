import Phaser from 'phaser';
import type { MovementInput } from './movement';

// 鍵位集中於此（plan open question 定案：方向鍵 + Z 跳 / X 攻擊；併支援 WASD + J/K）
const KEYS = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  down: ['DOWN', 'S'],
  jump: ['Z', 'J', 'SPACE'],
  attack: ['X', 'K'],
} as const;

export class InputSystem {
  private keys: Record<keyof typeof KEYS, Phaser.Input.Keyboard.Key[]>;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('keyboard plugin 不可用');
    this.keys = Object.fromEntries(
      Object.entries(KEYS).map(([action, codes]) => [action, codes.map((c) => kb.addKey(c))]),
    ) as Record<keyof typeof KEYS, Phaser.Input.Keyboard.Key[]>;
  }

  private down(action: keyof typeof KEYS): boolean {
    return this.keys[action].some((k) => k.isDown);
  }

  private justDown(action: keyof typeof KEYS): boolean {
    return this.keys[action].some((k) => Phaser.Input.Keyboard.JustDown(k));
  }

  /** 每幀取樣，餵給 movement 純函數 */
  sample(): MovementInput {
    return {
      left: this.down('left'),
      right: this.down('right'),
      jumpPressed: this.justDown('jump'),
      jumpHeld: this.down('jump'),
    };
  }

  get attackPressed(): boolean {
    return this.justDown('attack');
  }

  get downHeld(): boolean {
    return this.down('down');
  }
}
