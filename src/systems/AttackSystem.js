import { ATTACK_RANGE, ATTACK_DAMAGE, BLOCK_SIZE } from '../constants.js'

// Pure logic module — no Phaser dependencies, just data manipulation.
// Called from GameScene.update() every frame.
// Returns an array of event objects for GameScene to react to.

export function resolve(shooters, blocks, now) {
  const events = []

  for (const shooter of shooters) {
    if (shooter.isDepleted() || !shooter.active) continue

    // Re-acquire target if current is gone or out of range
    if (
      !shooter.currentTarget ||
      !shooter.currentTarget.active ||
      !_inRange(shooter, shooter.currentTarget)
    ) {
      shooter.currentTarget = _findTarget(shooter, blocks)
    }

    if (!shooter.currentTarget) continue
    if (!_inRange(shooter, shooter.currentTarget)) continue
    if (!shooter.canAttack(now)) continue

    const benched = shooter.doAttack(now)
    const killed = shooter.currentTarget.takeDamage(ATTACK_DAMAGE)

    if (killed) {
      events.push({ type: 'blockDestroyed', block: shooter.currentTarget, color: shooter.currentTarget.color })
      shooter.currentTarget.destroyWithEffect()
      shooter.currentTarget = null
    }

    if (benched) {
      events.push({ type: 'shooterBenched', shooter, color: shooter.color })
    }
  }

  return events
}

// Range check accounting for double-wide blocks
function _inRange(shooter, block) {
  const extra = block.isDouble ? BLOCK_SIZE / 2 : 0
  return Math.abs(shooter.x - block.x) <= ATTACK_RANGE + extra
}

// Only consider blocks within range with matching color.
// Prioritise the block closest to the danger zone (lowest x = most urgent).
function _findTarget(shooter, blocks) {
  const candidates = blocks.filter(b => b.active && b.color === shooter.color && _inRange(shooter, b))
  if (candidates.length === 0) return null
  candidates.sort((a, b) => a.x - b.x)
  return candidates[0]
}
