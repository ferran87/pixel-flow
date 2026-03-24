import { ATTACK_RANGE, ATTACK_DAMAGE } from '../constants.js'

// Pure logic module — no Phaser dependencies, just data manipulation.
// Called from GameScene.update() every frame.
// Returns an array of event objects for GameScene to react to.

export function resolve(shooters, blocks, now) {
  const events = []

  for (const shooter of shooters) {
    if (shooter.isDepleted() || !shooter.active) continue

    // Re-acquire target if current is gone or has drifted out of range
    if (
      !shooter.currentTarget ||
      !shooter.currentTarget.active ||
      Math.abs(shooter.x - shooter.currentTarget.x) > ATTACK_RANGE
    ) {
      shooter.currentTarget = _findTarget(shooter, blocks)
    }

    if (!shooter.currentTarget) continue

    const dist = Math.abs(shooter.x - shooter.currentTarget.x)
    if (dist > ATTACK_RANGE) continue
    if (!shooter.canAttack(now)) continue

    const depleted = shooter.doAttack(now)
    const killed = shooter.currentTarget.takeDamage(ATTACK_DAMAGE)

    if (killed) {
      events.push({ type: 'blockDestroyed', block: shooter.currentTarget, color: shooter.currentTarget.color })
      shooter.currentTarget.destroyWithEffect()
      shooter.currentTarget = null
    }

    if (depleted) {
      events.push({ type: 'shooterDepleted', shooter })
    }
  }

  return events
}

// Only consider blocks within the shooter's attack range.
// Among those, prioritize the one closest to the danger zone (lowest x).
function _findTarget(shooter, blocks) {
  const inRange = blocks.filter(
    b => b.active && b.color === shooter.color && Math.abs(shooter.x - b.x) <= ATTACK_RANGE
  )
  if (inRange.length === 0) return null

  inRange.sort((a, b) => a.x - b.x)
  return inRange[0]
}
