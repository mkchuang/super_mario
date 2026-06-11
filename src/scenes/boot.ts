import Phaser from 'phaser';

/** 啟動場景：全域設定後立即進 Preload（外部資源一律由 Preload 載入） */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.scene.start('preload');
  }
}
