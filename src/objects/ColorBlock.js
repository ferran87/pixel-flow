import Phaser from 'phaser'
import { BLOCK_SIZE } from '../constants.js'

export default class ColorBlock extends Phaser.GameObjects.Image {
  constructor(scene, x, y, color, maxHealth = 1) {
    const textureKey = `block_${color}`
    super(scene, x, y, textureKey)

    this.color = color
    this.maxHealth = maxHealth
    this.health = maxHealth

    scene.add.existing(this)
    this.setDisplaySize(BLOCK_SIZE, BLOCK_SIZE)

    // Pop-in tween
    this.setScale(0)
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.Out',
    })
  }

  takeDamage(amount) {
    this.health -= amount
    if (this.maxHealth > 1 && this.health === 1) {
      this.setTexture(`block_${this.color}_cracked`)
    }
    // Flash white on hit
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 60,
      yoyo: true,
    })
    return this.health <= 0
  }

  destroyWithEffect() {
    // Burst particle effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 10,
      tint: this.scene.textures.exists(`block_${this.color}`)
        ? undefined
        : 0xffffff,
    })

    // Auto-remove emitter after burst
    this.scene.time.delayedCall(450, () => particles.destroy())

    // Scale-out tween before destroy
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 150,
      onComplete: () => this.destroy(),
    })
  }
}
