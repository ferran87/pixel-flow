import Phaser from 'phaser'
import { MONSTER_SIZE, DEFAULT_RAIL_SPEED, RAIL_FIRE_RATE } from '../constants.js'
import { getHex } from '../utils/ColorPalette.js'

export default class Monster extends Phaser.GameObjects.Container {
  constructor(scene, color, ammo, speed) {
    super(scene, 0, 0)

    this.color = color
    this.ammoRemaining = ammo
    this.maxAmmo = ammo
    this.speed = speed ?? DEFAULT_RAIL_SPEED
    this.currentSide = 'bottom'
    this._lastFireTime = 0
    this._depleted = false
    this._railDistance = 0

    this._sprite = scene.add.image(0, 0, `shooter_${color}`)
    this._sprite.setDisplaySize(MONSTER_SIZE, MONSTER_SIZE)
    this.add(this._sprite)

    // Ammo badge — white rounded bubble with bold number
    this._ammoBg = scene.add.graphics()
    this._ammoBg.fillStyle(0xffffff, 0.92)
    this._ammoBg.fillRoundedRect(-10, 6, 20, 16, 8)
    this._ammoBg.lineStyle(1.5, 0x000000, 0.25)
    this._ammoBg.strokeRoundedRect(-10, 6, 20, 16, 8)
    this.add(this._ammoBg)

    this._ammoLabel = scene.add.text(0, 14, `${ammo}`, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#222233',
    }).setOrigin(0.5).setDepth(10)
    this.add(this._ammoLabel)

    scene.add.existing(this)
    this.setDepth(8)

    // Pop-in animation
    this.setScale(0)
    scene.tweens.add({
      targets: this,
      scaleX: 1, scaleY: 1,
      duration: 250,
      ease: 'Back.Out',
    })
  }

  canFire(now) {
    return !this._depleted && this.ammoRemaining > 0 && (now - this._lastFireTime >= RAIL_FIRE_RATE)
  }

  fire(now) {
    this._lastFireTime = now
    this.ammoRemaining--
    this._ammoLabel.setText(`${this.ammoRemaining}`)

    // Recoil pulse
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.82, scaleY: 0.82,
      duration: 50,
      yoyo: true,
      ease: 'Power2.Out',
    })

    // Flash sprite
    this.scene.tweens.add({
      targets: this._sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
    })

    if (this.ammoRemaining <= 0) {
      this._startDepletedExit()
      return true
    }
    return false
  }

  _startDepletedExit() {
    this._depleted = true
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 400,
      ease: 'Power2.In',
      onComplete: () => {
        this.emit('depleted', this)
        this.destroy()
      },
    })
  }

  isDepleted() {
    return this._depleted
  }

  shootBullet(targetX, targetY) {
    const hex = getHex(this.color)
    const startX = this.x
    const startY = this.y

    // Main bullet — larger, white core with colored glow
    const bullet = this.scene.add.circle(startX, startY, 6, 0xffffff).setDepth(7)
    const glow = this.scene.add.circle(startX, startY, 10, hex, 0.35).setDepth(6)

    // Trail particles spawned during flight
    const trailParts = []

    this.scene.tweens.add({
      targets: [bullet, glow],
      x: targetX,
      y: targetY,
      duration: 130,
      ease: 'Power2.In',
      onUpdate: () => {
        if (Math.random() > 0.4) {
          const trail = this.scene.add.circle(
            bullet.x + (Math.random() - 0.5) * 4,
            bullet.y + (Math.random() - 0.5) * 4,
            3 + Math.random() * 2,
            hex,
            0.5
          ).setDepth(6)
          trailParts.push(trail)
          this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scaleX: 0.2, scaleY: 0.2,
            duration: 150,
            onComplete: () => trail.destroy(),
          })
        }
      },
      onComplete: () => {
        // Impact flash ring
        const flash = this.scene.add.circle(targetX, targetY, 16, 0xffffff, 0.8).setDepth(7)
        this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          scaleX: 2.5, scaleY: 2.5,
          duration: 180,
          onComplete: () => flash.destroy(),
        })

        // Colored impact ring
        const ring = this.scene.add.circle(targetX, targetY, 10, hex, 0.5).setDepth(7)
        this.scene.tweens.add({
          targets: ring,
          alpha: 0,
          scaleX: 2, scaleY: 2,
          duration: 200,
          onComplete: () => ring.destroy(),
        })

        // Camera micro-shake
        this.scene.cameras.main.shake(50, 0.003)

        // Spawn extra impact particles
        const particles = this.scene.add.particles(targetX, targetY, 'particle', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.7, end: 0 },
          lifespan: 300,
          quantity: 10,
          tint: hex,
        })
        this.scene.time.delayedCall(350, () => particles.destroy())

        bullet.destroy()
        glow.destroy()
        trailParts.forEach(t => { if (t.active) t.destroy() })
      },
    })
  }
}
