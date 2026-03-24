import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js'
import BootScene from './scenes/BootScene.js'
import MenuScene from './scenes/MenuScene.js'
import LevelSelectScene from './scenes/LevelSelectScene.js'
import GameScene from './scenes/GameScene.js'
import WinScene from './scenes/WinScene.js'
import LossScene from './scenes/LossScene.js'
import PauseScene from './scenes/PauseScene.js'

// Destroy any previous game instance (HMR safety)
if (window.__game) {
  window.__game.destroy(true)
  window.__game = null
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    preserveDrawingBuffer: true,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [
    BootScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    WinScene,
    LossScene,
    PauseScene,
  ],
}

window.__game = new Phaser.Game(config)
