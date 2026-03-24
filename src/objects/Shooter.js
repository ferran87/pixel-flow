import Phaser from 'phaser'
import { SHOOTER_SIZE, BELT_Y, ATTACK_RATE } from '../constants.js'
import { getHex } from '../utils/ColorPalette.js'

export default class Shooter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, color, ammo) {
    super(scene, x, y)

    this.color = color
    this.ammoRemaining = ammo
    this.maxAmmo = ammo
    this.currentTarget = null
    this._lastAttackTime = 0
    this._depleted = false

    // Sprite body
    this._sprite = scene.add.image(0, 0, `shooter_${color}`)
    this._sprite.setDisplaySize(SHOOTER_SIZE, SHOOTER_SIZE)
    this.add(this._sprite)

    // Ammo pip row above head
    this._ammoPips = []
    this._buildAmmoPips()

    scene.add.existing(this)

    // Bounce-in tween on placement
    this.setScale(0)
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 250,
      ease: 'Back.Out',
    })
  }

  _buildAmmoPips() {
    this._ammoPips.forEach(p => p.destroy())
    this._ammoPips = []

    const spacing = 10
    const total = this.maxAmmo
    const startX = -(total - 1) * spacing / 2

    for (let i = 0; i < total; i++) {
      const pip = this.scene.add.circle(
        startX + i * spacing,
        -SHOOTER_SIZE / 2 - 8,
        4,
        i < this.ammoRemaining ? getHex(this.color) : 0x333355
      )
      this.add(pip)
      this._ammoPips.push(pip)
    }
  }

  _refreshAmmoPips() {
    this._ammoPips.forEach((pip, i) => {
      pip.setFillStyle(i < this.ammoRemaining ? getHex(this.color) : 0x333355)
    })
  }

  // Called by AttackSystem each frame
  canAttack(now) {
    return !this._depleted && now - this._lastAttackTime >= ATTACK_RATE
  }

  doAttack(now) {
    this._lastAttackTime = now
    this.ammoRemaining--
    this._refreshAmmoPips()

    // Flash effect
    this.scene.tweens.add({
      targets: this._sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
    })

    if (this.ammoRemaining <= 0) {
      this._deplete()
      return true   // signal depletion
    }
    return false
  }

  _deplete() {
    this._depleted = true
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 20,
      duration: 400,
      onComplete: () => {
        this.emit('depleted', this)
        this.destroy()
      },
    })
  }

  isDepleted() {
    return this._depleted
  }
}
