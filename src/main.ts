import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/game';
import { GRAVITY_Y } from './config/physics';
import { BootScene } from './scenes/boot';
import { PreloadScene } from './scenes/preload';
import { LevelScene } from './scenes/level';

/** 整數倍縮放：在視窗內取最大整數 zoom，確保 pixel art 不模糊 */
function integerZoom(): number {
  return Math.max(
    1,
    Math.floor(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)),
  );
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#000000',
  zoom: integerZoom(),
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, LevelScene],
});

window.addEventListener('resize', () => {
  game.scale.setZoom(integerZoom());
});

// dev-only：供 e2e 驗收腳本存取（production build 會移除）
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
