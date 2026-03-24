import Phaser from 'phaser'
import ColorBlock from './ColorBlock.js'
import { BLOCK_SIZE } from '../constants.js'

export default class DoubleBlock extends ColorBlock {
  constructor(scene, x, y, color) {
    super(scene, x, y, color, 2)
    this.isDouble = true
    // Override to 2× wide
    this.setDisplaySize(BLOCK_SIZE * 2, BLOCK_SIZE)
  }

  takeDamage(amount) {
    const killed = super.takeDamage(amount)
    // After first hit (health 2→1) shrink to single width
    if (!killed && this.health === 1) {
      this.scene.tweens.add({
        targets: this,
        displayWidth: BLOCK_SIZE,
        duration: 180,
        ease: 'Back.Out',
      })
      // Screen shake
      this.scene.cameras.main.shake(120, 0.005)
    }
    return killed
  }
}
