import Phaser from 'phaser'
import { SCENES } from '../constants.js'
import { registerPlaceholders } from '../utils/PlaceholderArt.js'
import GameState from '../GameState.js'
import levelsData from '../data/levels.json'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT })
  }

  preload() {
    // Loading bar background
    const { width, height } = this.scale
    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x333355)
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 16, 0x4A7BE8)
    bar.setOrigin(0, 0.5)

    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
      fontSize: '18px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.load.on('progress', (value) => {
      bar.width = 300 * value
    })

    // TODO Phase 4: swap these with real asset loads:
    // this.load.image('block_red', '/assets/sprites/blocks/block_red.png')
    // this.load.spritesheet('shooter_red', '/assets/sprites/shooters/shooter_red.png', { frameWidth: 32, frameHeight: 32 })
    // etc.
  }

  create() {
    registerPlaceholders(this)
    GameState.levels = levelsData
    this.scene.start(SCENES.MENU)
  }
}
