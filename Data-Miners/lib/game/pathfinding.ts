import type { TileData, Building, PathNode } from "./types"

/**
 * A* pathfinding implementation to check connectivity in the power grid
 */
export function findPath(
  grid: TileData[][],
  buildings: Map<string, Building>,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): PathNode[] | null {
  const gridHeight = grid.length
  const gridWidth = grid[0]?.length || 0

  if (
    startX < 0 ||
    startX >= gridWidth ||
    startY < 0 ||
    startY >= gridHeight ||
    endX < 0 ||
    endX >= gridWidth ||
    endY < 0 ||
    endY >= gridHeight
  ) {
    return null
  }

  const openSet: PathNode[] = []
  const closedSet = new Set<string>()

  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY, endX, endY),
    f: 0,
    parent: null,
  }
  startNode.f = startNode.g + startNode.h
  openSet.push(startNode)

  while (openSet.length > 0) {
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    const currentKey = `${current.x}-${current.y}`

    // Check if we reached the goal
    if (current.x === endX && current.y === endY) {
      return reconstructPath(current)
    }

    closedSet.add(currentKey)

    // Check all neighbors (including diagonals for power connections)
    const neighbors = getNeighbors(current.x, current.y)

    for (const [nx, ny] of neighbors) {
      const neighborKey = `${nx}-${ny}`

      // Skip if already evaluated
      if (closedSet.has(neighborKey)) continue

      // Skip if out of bounds
      if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue

      // Check if there's a building at this position (required for power transmission)
      const hasBuilding = buildings.has(neighborKey)
      if (!hasBuilding && !(nx === endX && ny === endY)) continue

      const tentativeG = current.g + 1

      let neighborNode = openSet.find((n) => n.x === nx && n.y === ny)

      if (!neighborNode) {
        neighborNode = {
          x: nx,
          y: ny,
          g: tentativeG,
          h: heuristic(nx, ny, endX, endY),
          f: 0,
          parent: current,
        }
        neighborNode.f = neighborNode.g + neighborNode.h
        openSet.push(neighborNode)
      } else if (tentativeG < neighborNode.g) {
        neighborNode.g = tentativeG
        neighborNode.f = neighborNode.g + neighborNode.h
        neighborNode.parent = current
      }
    }
  }

  return null // No path found
}

/**
 * Get all buildings connected to the power source using flood fill
 * Now checks if EITHER building can reach the other (uses max range of both)
 * Excludes monoliths from power grid connections
 */
export function getConnectedBuildings(
  grid: TileData[][],
  buildings: Map<string, Building>,
  sourceX: number,
  sourceY: number,
): Set<string> {
  const connected = new Set<string>()
  const visited = new Set<string>()
  const queue: [number, number][] = [[sourceX, sourceY]]

  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    const key = `${x}-${y}`

    if (visited.has(key)) continue
    visited.add(key)

    const building = buildings.get(key)
    if (!building) continue

    if (building.type === "monolith") continue

    connected.add(key)

    buildings.forEach((otherBuilding, otherKey) => {
      if (visited.has(otherKey)) return

      if (otherBuilding.type === "monolith") return

      const dx = Math.abs(otherBuilding.tileX - x)
      const dy = Math.abs(otherBuilding.tileY - y)
      const distance = Math.max(dx, dy) // Chebyshev distance

      // Connect if EITHER building can reach the other
      const canCurrentReach = distance <= building.connectionRange
      const canOtherReach = distance <= otherBuilding.connectionRange

      if (canCurrentReach || canOtherReach) {
        queue.push([otherBuilding.tileX, otherBuilding.tileY])
      }
    })
  }

  return connected
}

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  // Chebyshev distance (allows diagonal movement)
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2))
}

function getNeighbors(x: number, y: number): [number, number][] {
  return getNeighborsInRange(x, y, 1) // Assuming DEFAULT_RANGE is 1
}

function getNeighborsInRange(x: number, y: number, range: number): [number, number][] {
  const neighbors: [number, number][] = []

  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (dx === 0 && dy === 0) continue
      neighbors.push([x + dx, y + dy])
    }
  }

  return neighbors
}

function reconstructPath(node: PathNode): PathNode[] {
  const path: PathNode[] = []
  let current: PathNode | null = node

  while (current) {
    path.unshift(current)
    current = current.parent
  }

  return path
}
