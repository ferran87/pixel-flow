/**
 * Rail-based attack system.
 *
 * Each frame, for every monster on the rail:
 * 1. Determine which side of the grid it faces (from rail segment).
 * 2. Find the lane it's aligned with.
 * 3. Look up the edge block in that lane.
 * 4. If the block color matches the monster's color, fire.
 */

export function resolve(monsters, pixelGrid, now) {
  const events = []

  for (const monster of monsters) {
    if (monster.isDepleted() || !monster.active) continue
    if (!monster.canFire(now)) continue

    const side = monster.currentSide
    const lane = pixelGrid.getLaneForPosition(side, monster.x, monster.y)
    const edgeBlock = pixelGrid.getEdgeBlock(side, lane)

    if (!edgeBlock) continue
    if (edgeBlock.cell.color !== monster.color) continue

    // Fire!
    const cellCenter = _getCellCenter(pixelGrid, edgeBlock.row, edgeBlock.col)
    monster.shootBullet(cellCenter.x, cellCenter.y)
    const depleted = monster.fire(now)

    pixelGrid.destroyBlock(edgeBlock.row, edgeBlock.col)
    events.push({
      type: 'blockDestroyed',
      row: edgeBlock.row,
      col: edgeBlock.col,
      color: edgeBlock.cell.color,
    })

    if (depleted) {
      events.push({ type: 'monsterDepleted', monster, color: monster.color })
    }
  }

  return events
}

function _getCellCenter(grid, row, col) {
  return {
    x: grid.originX + col * grid.cellSize + grid.cellSize / 2,
    y: grid.originY + row * grid.cellSize + grid.cellSize / 2,
  }
}
