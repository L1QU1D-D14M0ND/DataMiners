import * as Phaser from "phaser"
import type { TileData, Building, GameState, MatchStats, TerrainType, BuildingType, SelectedTool } from "../types"
import { getConnectedBuildings } from "../pathfinding"
import { BuildingRegistry } from "../buildings"
import { TileRegistry } from "../tiles"
import { TechRegistry } from "../tech"
import { SoundManager } from "../sound-manager"

const TILE_SIZE = 32
const GRID_WIDTH = 19
const GRID_HEIGHT = 15
const TICK_INTERVAL = 1000

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1
const PAN_SPEED = 10

const WIN_DOWNLOAD_SPEED_THRESHOLD = 10

export class GameScene extends Phaser.Scene {
  private grid: TileData[][] = []
  private buildings: Map<string, Building> = new Map()
  private tileSprites: Phaser.GameObjects.Rectangle[][] = []
  private buildingSprites: Map<string, Phaser.GameObjects.Container> = new Map()
  private powerLines: Phaser.GameObjects.Graphics | null = null
  private monolithPosition: { x: number; y: number } | null = null

  private tick = 0
  private resources = {
    energy: 100,
    maxEnergy: 500,
    rawOre: 50,
    maxRawOre: 500,
    buildingMaterials: 30,
    maxBuildingMaterials: 500,
    dataUploaded: 0,
    maxDataUploaded: 100,
  }
  private selectedTool: SelectedTool = null
  private inputBlocked = false
  private gridBounds = { x: 0, y: 0, width: 0, height: 0 }
  private currentZoom = 1
  private isDragging = false
  private lastPointerPosition = { x: 0, y: 0 }
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private cleanupCallbacks: Array<() => void> = []
  private cleanupComplete = false
  private gameWon = false
  private totalEnergyGenerated = 0

  constructor() {
    super({ key: "GameScene" })
  }

  create() {
    this.cleanupCallbacks = []
    this.cleanupComplete = false
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSceneListeners, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupSceneListeners, this)

    TechRegistry.reset()
    this.initializeGrid()
    this.renderGrid()
    this.placePowerSource()
    this.placeAlienMonolith()
    this.setupInput()
    this.startTickSystem()
    this.emitGameState()
    this.setupSettingsListener()
    this.setupToolListener()
    this.setupZoom()
    this.setupCameraPan()
    this.centerCameraOnGrid()
    this.setupTechListener() // Add tech listener
  }

  private addWindowListener<T extends Event>(type: string, listener: (event: T) => void) {
    const eventListener = listener as EventListener
    window.addEventListener(type, eventListener)
    this.cleanupCallbacks.push(() => window.removeEventListener(type, eventListener))
  }

  private addCanvasListener(type: string, listener: (event: Event) => void) {
    this.game.canvas.addEventListener(type, listener)
    this.cleanupCallbacks.push(() => this.game.canvas.removeEventListener(type, listener))
  }

  private cleanupSceneListeners() {
    if (this.cleanupComplete) return

    for (const cleanup of this.cleanupCallbacks) {
      cleanup()
    }

    this.cleanupCallbacks = []
    this.cleanupComplete = true
  }

  private centerCameraOnGrid() {
    const gridCenterX = this.gridBounds.x + this.gridBounds.width / 2
    const gridCenterY = this.gridBounds.y + this.gridBounds.height / 2
    this.cameras.main.centerOn(gridCenterX, gridCenterY)
  }

  private placeAlienMonolith() {
    const corners = [
      { x: 1, y: 1 }, // Top-left
      { x: GRID_WIDTH - 3, y: 1 }, // Top-right (need 2x2 space)
      { x: 1, y: GRID_HEIGHT - 3 }, // Bottom-left
      { x: GRID_WIDTH - 3, y: GRID_HEIGHT - 3 }, // Bottom-right
    ]

    const corner = corners[Math.floor(Math.random() * corners.length)]
    this.monolithPosition = corner

    // Clear terrain for 2x2 monolith area and make it buildable
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const tile = this.grid[corner.y + dy]?.[corner.x + dx]
        if (tile) {
          tile.terrainType = "grass"
          tile.buildable = true
          // Update tile sprite color
          const tileSprite = this.tileSprites[corner.y + dy]?.[corner.x + dx]
          if (tileSprite) {
            tileSprite.setFillStyle(0x2d5a27)
          }
        }
      }
    }

    // Place the monolith building (using top-left corner as anchor)
    this.placeBuilding(corner.x, corner.y, "monolith")
  }

  private isAdjacentToMonolith(tileX: number, tileY: number): boolean {
    if (!this.monolithPosition) return false

    const mx = this.monolithPosition.x
    const my = this.monolithPosition.y

    // Check if tile is adjacent to any of the 4 monolith tiles
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const monolithTileX = mx + dx
        const monolithTileY = my + dy

        // Check all 8 directions from this monolith tile
        const distance = Math.max(Math.abs(tileX - monolithTileX), Math.abs(tileY - monolithTileY))
        if (distance === 1) {
          // Make sure we're not inside the monolith
          const insideMonolith = tileX >= mx && tileX < mx + 2 && tileY >= my && tileY < my + 2
          if (!insideMonolith) {
            return true
          }
        }
      }
    }
    return false
  }

  private setupSettingsListener() {
    const handleSettingsToggle = (e: CustomEvent<{ isOpen: boolean }>) => {
      this.inputBlocked = e.detail.isOpen
    }
    this.addWindowListener("settingsMenuToggle", handleSettingsToggle)
  }

  private setupToolListener() {
    const handleToolChange = (e: CustomEvent<{ tool: SelectedTool }>) => {
      this.selectedTool = e.detail.tool
    }
    this.addWindowListener("toolChange", handleToolChange)
  }

  private setupZoom() {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
      if (this.inputBlocked) return

      const zoomChange = deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      this.setZoom(this.currentZoom + zoomChange)
    })

    const handleZoomChange = (e: CustomEvent<{ zoom: number }>) => {
      this.setZoom(e.detail.zoom)
    }
    this.addWindowListener("zoomChange", handleZoomChange)

    const handleZoomIn = () => {
      this.setZoom(this.currentZoom + ZOOM_STEP)
    }
    this.addWindowListener("zoomIn", handleZoomIn)

    const handleZoomOut = () => {
      this.setZoom(this.currentZoom - ZOOM_STEP)
    }
    this.addWindowListener("zoomOut", handleZoomOut)

    const handleZoomReset = () => {
      this.setZoom(1)
    }
    this.addWindowListener("zoomReset", handleZoomReset)

    this.emitZoomLevel()
  }

  private setZoom(zoom: number) {
    this.currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    this.cameras.main.setZoom(this.currentZoom)
    this.emitZoomLevel()
  }

  private emitZoomLevel() {
    window.dispatchEvent(
      new CustomEvent("zoomLevelUpdate", {
        detail: { zoom: this.currentZoom, min: MIN_ZOOM, max: MAX_ZOOM },
      }),
    )
  }

  private initializeGrid() {
    const centerX = Math.floor(GRID_WIDTH / 2)
    const centerY = Math.floor(GRID_HEIGHT / 2)

    for (let y = 0; y < GRID_HEIGHT; y++) {
      this.grid[y] = []
      for (let x = 0; x < GRID_WIDTH; x++) {
        const isCenter = x === centerX && y === centerY
        const terrainType = isCenter ? "grass" : this.generateTerrain(x, y)
        const tileDef = TileRegistry.getTile(terrainType)

        this.grid[y][x] = {
          x,
          y,
          terrainType,
          building: null,
          isPowered: false,
          buildable: tileDef?.stats.buildable ?? terrainType !== "water",
        }
      }
    }
  }

  private generateTerrain(x: number, y: number): TerrainType {
    const centerX = Math.floor(GRID_WIDTH / 2)
    const centerY = Math.floor(GRID_HEIGHT / 2)

    if (Math.abs(x - centerX) <= 1 && Math.abs(y - centerY) <= 1) {
      return "grass"
    }

    const noise = Math.sin(x * 0.3) * Math.cos(y * 0.4) + Math.random() * 0.3

    if (noise > 0.7) return "rock"
    if (noise < -0.5) return "water"
    if (noise > 0.4) return "sand"

    return "grass"
  }

  private renderGrid() {
    const offsetX = (800 - GRID_WIDTH * TILE_SIZE) / 2
    const offsetY = (600 - GRID_HEIGHT * TILE_SIZE) / 2

    this.gridBounds = {
      x: offsetX,
      y: offsetY,
      width: GRID_WIDTH * TILE_SIZE,
      height: GRID_HEIGHT * TILE_SIZE,
    }

    for (let y = 0; y < GRID_HEIGHT; y++) {
      this.tileSprites[y] = []
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.grid[y][x]
        const pixelX = offsetX + x * TILE_SIZE
        const pixelY = offsetY + y * TILE_SIZE

        const tileDef = TileRegistry.getTile(tile.terrainType)
        const color = tileDef?.visuals.color ?? this.getTerrainColor(tile.terrainType)
        const borderColor = tileDef?.visuals.borderColor ?? 0x1a1a2e
        const borderAlpha = tileDef?.visuals.borderAlpha ?? 0.5

        const rect = this.add.rectangle(
          pixelX + TILE_SIZE / 2,
          pixelY + TILE_SIZE / 2,
          TILE_SIZE - 2,
          TILE_SIZE - 2,
          color,
        )
        rect.setStrokeStyle(1, borderColor, borderAlpha)
        rect.setInteractive()
        rect.setData("tileX", x)
        rect.setData("tileY", y)

        this.tileSprites[y][x] = rect
      }
    }

    this.powerLines = this.add.graphics()
  }

  private placePowerSource() {
    const centerX = Math.floor(GRID_WIDTH / 2)
    const centerY = Math.floor(GRID_HEIGHT / 2)

    this.placeBuilding(centerX, centerY, "power_source")
  }

  private placeBuilding(tileX: number, tileY: number, type: BuildingType): boolean {
    const definition = BuildingRegistry.getBuilding(type)
    if (!definition) return false

    const buildingSize = definition.stats.size || 1

    for (let dy = 0; dy < buildingSize; dy++) {
      for (let dx = 0; dx < buildingSize; dx++) {
        const tile = this.grid[tileY + dy]?.[tileX + dx]
        if (!tile) return false
        if (tile.building && !(dx === 0 && dy === 0 && type === "monolith")) return false
      }
    }

    const tile = this.grid[tileY]?.[tileX]
    if (!tile) return false

    if (type !== "monolith") {
      const tileDef = TileRegistry.getTile(tile.terrainType)
      if (type !== "generator" && type !== "drill" && !tileDef?.stats.buildable) return false

      if (!definition.stats.allowedTerrain.includes(tile.terrainType)) {
        return false
      }
    }

    if (definition.stats.requiredAdjacent.length > 0) {
      if (definition.stats.requiredAdjacent.includes("monolith")) {
        if (!this.isAdjacentToMonolith(tileX, tileY)) {
          return false
        }
      }
    }

    const buildingId = `${tileX}-${tileY}`

    const baseBuildTime = definition.stats.buildingMaterialsCost
    const buildTimeMultiplier = 1 - TechRegistry.getGlobalModifier("buildTimeMultiplier")
    const finalBuildTime = Math.max(1, Math.floor(baseBuildTime * buildTimeMultiplier))

    // Power source and monolith are instant
    const isInstant = type === "power_source" || type === "monolith"

    const building: Building = {
      id: buildingId,
      type,
      tileX,
      tileY,
      energyOutput: definition.stats.energyOutput,
      energyConsumption: definition.stats.energyConsumption,
      isPowered: type === "power_source" || type === "monolith",
      isActive: type === "power_source",
      efficiency: definition.stats.efficiency,
      connectionRange: definition.stats.connectionRange,
      materialsProduction: definition.stats.materialsProduction,
      size: buildingSize,
      buildTime: isInstant ? 0 : finalBuildTime,
      buildProgress: isInstant ? finalBuildTime : 0,
    }

    this.buildings.set(buildingId, building)

    for (let dy = 0; dy < buildingSize; dy++) {
      for (let dx = 0; dx < buildingSize; dx++) {
        const t = this.grid[tileY + dy]?.[tileX + dx]
        if (t) {
          t.building = type
        }
      }
    }

    this.renderBuilding(building)
    this.updatePowerNetwork()
    this.emitGameState()

    return true
  }

  private renderBuilding(building: Building) {
    const definition = BuildingRegistry.getBuilding(building.type)
    if (!definition) return

    const offsetX = (800 - GRID_WIDTH * TILE_SIZE) / 2
    const offsetY = (600 - GRID_HEIGHT * TILE_SIZE) / 2

    const buildingSize = definition.stats.size || 1

    const pixelX = offsetX + building.tileX * TILE_SIZE + (TILE_SIZE * buildingSize) / 2
    const pixelY = offsetY + building.tileY * TILE_SIZE + (TILE_SIZE * buildingSize) / 2

    const container = this.add.container(pixelX, pixelY)

    const size = definition.visuals.size
    const base = this.add.rectangle(0, 0, size, size, definition.visuals.color)
    base.setStrokeStyle(2, 0xffffff, 0.5)
    container.add(base)

    const icon = this.createBuildingIcon(definition.visuals.iconType, buildingSize)
    container.add(icon)

    if (building.type !== "monolith") {
      const powerIndicator = this.add.circle(size / 2 - 2, -size / 2 + 2, 4, 0x00ff00)
      powerIndicator.setName("powerIndicator")
      container.add(powerIndicator)
    }

    this.buildingSprites.set(building.id, container)
  }

  private createBuildingIcon(iconType: string, buildingSize = 1): Phaser.GameObjects.Graphics {
    const g = this.add.graphics()
    const scale = buildingSize > 1 ? 1.5 : 1

    switch (iconType) {
      case "lightning":
        g.fillStyle(0x1a1a2e)
        g.fillTriangle(-4 * scale, -8 * scale, 4 * scale, -8 * scale, 0, 0)
        g.fillTriangle(-2 * scale, -2 * scale, 4 * scale, 8 * scale, -4 * scale, 0)
        break
      case "circle":
        g.fillStyle(0x1a1a2e)
        g.fillCircle(0, 0, 5 * scale)
        break
      case "triangle":
        g.fillStyle(0x1a1a2e)
        g.fillTriangle(-6 * scale, 6 * scale, 6 * scale, 6 * scale, 0, -6 * scale)
        break
      case "factory":
        g.fillStyle(0x1a1a2e)
        g.fillRect(-6 * scale, -2 * scale, 12 * scale, 8 * scale)
        g.fillRect(-4 * scale, -6 * scale, 4 * scale, 4 * scale)
        break
      case "drill":
        g.fillStyle(0x1a1a2e)
        g.fillTriangle(0, -6 * scale, -5 * scale, 6 * scale, 5 * scale, 6 * scale)
        g.fillRect(-2 * scale, -8 * scale, 4 * scale, 4 * scale)
        break
      case "monolith":
        g.fillStyle(0x2a0a3a)
        g.fillRect(-8, -20, 16, 40)
        g.fillStyle(0xaa00ff, 0.5)
        g.fillRect(-6, -18, 12, 36)
        // Glowing runes
        g.fillStyle(0xff00ff, 0.8)
        g.fillRect(-4, -14, 8, 2)
        g.fillRect(-4, -8, 8, 2)
        g.fillRect(-4, -2, 8, 2)
        g.fillRect(-4, 4, 8, 2)
        g.fillRect(-4, 10, 8, 2)
        break
      case "uplink":
        g.fillStyle(0x1a1a2e)
        g.fillRect(-2, -4, 4, 10)
        g.lineStyle(2, 0x1a1a2e)
        g.strokeCircle(0, -6, 6)
        g.fillStyle(0x00ffff, 0.6)
        g.fillCircle(0, -6, 3)
        break
    }

    return g
  }

  private removeBuilding(tileX: number, tileY: number): boolean {
    const tile = this.grid[tileY]?.[tileX]
    if (!tile || !tile.building) return false

    const definition = BuildingRegistry.getBuilding(tile.building)
    if (!definition?.deletable) return false

    let buildingId = `${tileX}-${tileY}`
    let building = this.buildings.get(buildingId)

    // If not found, check if this is part of a larger building
    if (!building) {
      for (const [id, b] of this.buildings) {
        const bDef = BuildingRegistry.getBuilding(b.type)
        const size = bDef?.stats.size || 1
        if (tileX >= b.tileX && tileX < b.tileX + size && tileY >= b.tileY && tileY < b.tileY + size) {
          building = b
          buildingId = id
          break
        }
      }
    }

    if (!building) return false

    const buildingDef = BuildingRegistry.getBuilding(building.type)
    if (!buildingDef?.deletable) return false

    const refundAmount = Math.floor(buildingDef.stats.buildingMaterialsCost / 2)
    this.resources.buildingMaterials = Math.min(
      this.resources.maxBuildingMaterials,
      this.resources.buildingMaterials + refundAmount,
    )

    const sprite = this.buildingSprites.get(buildingId)
    if (sprite) {
      sprite.destroy()
      this.buildingSprites.delete(buildingId)
    }

    const size = buildingDef.stats.size || 1
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const t = this.grid[building.tileY + dy]?.[building.tileX + dx]
        if (t) {
          t.building = null
          t.isPowered = false
        }
      }
    }

    this.buildings.delete(buildingId)

    this.updatePowerNetwork()
    this.emitGameState()

    return true
  }

  private setupInput() {
    this.input.on("gameobjectdown", (_: Phaser.Input.Pointer, obj: Phaser.GameObjects.Rectangle) => {
      if (this.inputBlocked) return

      const tileX = obj.getData("tileX") as number
      const tileY = obj.getData("tileY") as number

      if (this.selectedTool === "delete") {
        const deleted = this.removeBuilding(tileX, tileY)
        if (deleted) {
          SoundManager.playDelete()
        }
      } else if (this.selectedTool) {
        const cost = this.getBuildingCost(this.selectedTool)
        if (this.resources.buildingMaterials >= cost) {
          if (this.placeBuilding(tileX, tileY, this.selectedTool)) {
            this.resources.buildingMaterials -= cost
            this.emitGameState()
            SoundManager.playBuild()
          } else {
            SoundManager.playError()
          }
        } else {
          SoundManager.playError()
        }
      }
    })

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.inputBlocked) return

      const { x, y } = pointer
      const isOutsideGrid =
        x < this.gridBounds.x ||
        x > this.gridBounds.x + this.gridBounds.width ||
        y < this.gridBounds.y ||
        y > this.gridBounds.y + this.gridBounds.height

      if (isOutsideGrid) {
        this.selectedTool = null
        window.dispatchEvent(new CustomEvent("deselectTool"))
      }
    })

    const placeableBuildings = BuildingRegistry.getPlaceableBuildings()
    for (const building of placeableBuildings) {
      if (building.shortcut) {
        this.input.keyboard?.on(`keydown-${building.shortcut}`, () => {
          if (this.inputBlocked) return
          const newTool = this.selectedTool === building.id ? null : (building.id as SelectedTool)
          window.dispatchEvent(new CustomEvent("toolChange", { detail: { tool: newTool } }))
          window.dispatchEvent(new CustomEvent("keyboardToolChange", { detail: { tool: newTool } }))
        })
      }
    }

    this.input.keyboard?.on("keydown-X", () => {
      if (this.inputBlocked) return
      const newTool = this.selectedTool === "delete" ? null : "delete"
      window.dispatchEvent(new CustomEvent("toolChange", { detail: { tool: newTool } }))
      window.dispatchEvent(new CustomEvent("keyboardToolChange", { detail: { tool: newTool } }))
    })
  }

  private getBuildingCost(type: BuildingType): number {
    const definition = BuildingRegistry.getBuilding(type)
    return definition?.stats.buildingMaterialsCost ?? 0
  }

  private startTickSystem() {
    this.time.addEvent({
      delay: TICK_INTERVAL,
      callback: this.onTick,
      callbackScope: this,
      loop: true,
    })
  }

  private onTick() {
    this.tick++
    this.refreshBuildingStats()
    this.progressConstruction() // Process building construction
    this.updatePowerNetwork()
    this.processUpkeep()
    this.calculateEnergyFlow()
    this.checkWinCondition()
    this.emitGameState()
  }

  private refreshBuildingStats() {
    this.buildings.forEach((building) => {
      const definition = BuildingRegistry.getBuilding(building.type)
      if (definition) {
        building.energyOutput = definition.stats.energyOutput
        building.energyConsumption = definition.stats.energyConsumption
        building.efficiency = definition.stats.efficiency
        building.connectionRange = definition.stats.connectionRange
        building.materialsProduction = definition.stats.materialsProduction
      }
    })
  }

  private updatePowerNetwork() {
    this.buildings.forEach((building) => {
      building.isPowered = building.type === "power_source"
    })

    const powerSource = Array.from(this.buildings.values()).find((b) => b.type === "power_source")
    if (!powerSource) return

    const connectedIds = getConnectedBuildings(this.grid, this.buildings, powerSource.tileX, powerSource.tileY)

    connectedIds.forEach((id) => {
      const building = this.buildings.get(id)
      if (building && building.type !== "monolith") {
        building.isPowered = true
      }
    })

    this.updateActiveVisuals()
    this.drawPowerLines()
  }

  private updateActiveVisuals() {
    this.buildings.forEach((building) => {
      const container = this.buildingSprites.get(building.id)
      if (container) {
        const indicator = container.getByName("powerIndicator") as Phaser.GameObjects.Arc
        if (indicator) {
          if (this.isUnderConstruction(building)) {
            indicator.setFillStyle(0xffff00) // Yellow - under construction
          } else if (!building.isPowered) {
            indicator.setFillStyle(0xff0000) // Red - no power
          } else if (!building.isActive) {
            indicator.setFillStyle(0xffaa00) // Orange - no upkeep
          } else {
            indicator.setFillStyle(0x00ff00) // Green - fully operational
          }
        }

        // Dim inactive or under-construction buildings
        const base = container.first as Phaser.GameObjects.Rectangle
        if (base) {
          base.setAlpha(building.isActive && !this.isUnderConstruction(building) ? 1 : 0.5)
        }
      }
    })
  }

  private drawPowerLines() {
    if (!this.powerLines) return
    this.powerLines.clear()

    const offsetX = (800 - GRID_WIDTH * TILE_SIZE) / 2
    const offsetY = (600 - GRID_HEIGHT * TILE_SIZE) / 2

    this.buildings.forEach((building) => {
      if (!building.isPowered) return
      if (building.type === "monolith") return

      this.buildings.forEach((neighbor) => {
        if (!neighbor.isPowered) return
        if (neighbor.id <= building.id) return // Avoid duplicate lines
        if (neighbor.type === "monolith") return

        const dx = Math.abs(neighbor.tileX - building.tileX)
        const dy = Math.abs(neighbor.tileY - building.tileY)
        const distance = Math.max(dx, dy)

        // Connect if EITHER building can reach the other
        const canBuildingReach = distance <= building.connectionRange
        const canNeighborReach = distance <= neighbor.connectionRange

        if (canBuildingReach || canNeighborReach) {
          const bSize = building.size || 1
          const nSize = neighbor.size || 1
          const x1 = offsetX + building.tileX * TILE_SIZE + (TILE_SIZE * bSize) / 2
          const y1 = offsetY + building.tileY * TILE_SIZE + (TILE_SIZE * bSize) / 2
          const x2 = offsetX + neighbor.tileX * TILE_SIZE + (TILE_SIZE * nSize) / 2
          const y2 = offsetY + neighbor.tileY * TILE_SIZE + (TILE_SIZE * nSize) / 2

          this.powerLines!.lineStyle(3, 0x4488ff, 0.3)
          this.powerLines!.lineBetween(x1, y1, x2, y2)
          this.powerLines!.lineStyle(1, 0x88ccff, 0.8)
          this.powerLines!.lineBetween(x1, y1, x2, y2)
        }
      })
    })
  }

  private getBuildingsInRange(x: number, y: number, range = 1): Building[] {
    const inRange: Building[] = []

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (dx === 0 && dy === 0) continue
        const id = `${x + dx}-${y + dy}`
        const building = this.buildings.get(id)
        if (building) {
          inRange.push(building)
        }
      }
    }

    return inRange
  }

  // Cache for energy calculations to avoid redundant iterations
  private cachedEnergyStats = {
    generation: 0,
    consumption: 0,
    lineLoss: 0,
    materialsPerTick: 0,
    connectedCount: 0,
  }

  private calculateEnergyFlow() {
    let generation = 0
    let consumption = 0
    let lineLoss = 0
    let materialsPerTick = 0
    let connectedCount = 0

    const powerSource = Array.from(this.buildings.values()).find((b) => b.type === "power_source")
    const powerSourceX = powerSource?.tileX ?? 0
    const powerSourceY = powerSource?.tileY ?? 0

    this.buildings.forEach((building) => {
      if (building.isPowered) {
        connectedCount++
        
        if (building.isActive) {
          generation += Math.floor(building.energyOutput * building.efficiency)
        }

        if (building.type !== "power_source" && building.type !== "monolith") {
          // Use faster Manhattan-ish approximation for line loss calculation
          const dx = building.tileX - powerSourceX
          const dy = building.tileY - powerSourceY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (building.isActive) {
            lineLoss += Math.floor(distance * 0.1 * building.energyConsumption)
            consumption += building.energyConsumption
          }

          if (building.isActive && building.type === "factory" && building.materialsProduction > 0) {
            materialsPerTick += building.materialsProduction
          }
        }
      }
    })

    const netPower = Math.floor(generation - consumption - lineLoss)
    this.resources.energy = Math.floor(
      Math.max(0, Math.min(this.resources.maxEnergy, this.resources.energy + netPower)),
    )
    this.totalEnergyGenerated += Math.max(0, generation)

    // Cache for emitGameState
    this.cachedEnergyStats = { generation, consumption, lineLoss, materialsPerTick, connectedCount }
  }

  private calculateDownloadSpeed(): number {
    let totalDownloadSpeed = 0

    this.buildings.forEach((building) => {
      if (building.type === "uplink" && building.isActive && building.isPowered) {
        const definition = BuildingRegistry.getBuilding(building.type)
        if (definition) {
          totalDownloadSpeed += definition.stats.dataUploadRate
        }
      }
    })

    return totalDownloadSpeed
  }

  private checkWinCondition() {
    if (this.gameWon) return

    const downloadSpeed = this.calculateDownloadSpeed()
    if (downloadSpeed >= WIN_DOWNLOAD_SPEED_THRESHOLD) {
      this.gameWon = true
      this.inputBlocked = true
      window.dispatchEvent(
        new CustomEvent("gameWon", {
          detail: {
            outcome: "win",
            playerStats: this.getPlayerMatchStats(downloadSpeed),
            rivalStats: null,
          },
        }),
      )
    }
  }

  private getPlayerMatchStats(downloadSpeed = this.calculateDownloadSpeed()): MatchStats {
    return {
      timeElapsedSeconds: Math.floor(this.tick * TICK_INTERVAL / 1000),
      energyGenerated: this.totalEnergyGenerated,
      downloadSpeed,
    }
  }

  private emitGameState() {
    const { generation, consumption, lineLoss, materialsPerTick, connectedCount } = this.cachedEnergyStats
    const downloadSpeed = this.calculateDownloadSpeed()

    const state: GameState = {
      tick: this.tick,
      resources: { ...this.resources },
      energyFlow: {
        generation,
        consumption,
        lineLoss,
        netPower: Math.floor(generation - consumption - lineLoss),
      },
      connectedBuildings: connectedCount,
      buildings: Array.from(this.buildings.values()),
      materialsPerTick,
      downloadSpeed,
      elapsedSeconds: Math.floor(this.tick * TICK_INTERVAL / 1000),
      totalEnergyGenerated: this.totalEnergyGenerated,
      gameWon: this.gameWon,
    }

    window.dispatchEvent(new CustomEvent("gameStateUpdate", { detail: state }))
  }

  private setupCameraPan() {
    this.cursors = this.input.keyboard?.createCursorKeys() ?? null

    this.input.keyboard?.on("keydown-W", () => {
      if (this.inputBlocked) return
      this.panCamera(0, -PAN_SPEED * 5)
    })
    this.input.keyboard?.on("keydown-S", () => {
      if (this.inputBlocked) return
      this.panCamera(0, PAN_SPEED * 5)
    })
    this.input.keyboard?.on("keydown-A", () => {
      if (this.inputBlocked) return
      this.panCamera(-PAN_SPEED * 5, 0)
    })
    this.input.keyboard?.on("keydown-D", () => {
      if (this.inputBlocked) return
      this.panCamera(PAN_SPEED * 5, 0)
    })

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.inputBlocked) return
      if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
        this.isDragging = true
        this.lastPointerPosition = { x: pointer.x, y: pointer.y }
      }
    })

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && !this.inputBlocked) {
        const deltaX = this.lastPointerPosition.x - pointer.x
        const deltaY = this.lastPointerPosition.y - pointer.y
        this.panCamera(deltaX, deltaY)
        this.lastPointerPosition = { x: pointer.x, y: pointer.y }
      }
    })

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.middleButtonDown() && !pointer.rightButtonDown()) {
        this.isDragging = false
      }
    })

    this.addCanvasListener("contextmenu", (e) => {
      e.preventDefault()
    })

    this.addWindowListener("panCamera", (e: CustomEvent<{ x: number; y: number }>) => {
      this.panCamera(e.detail.x, e.detail.y)
    })

    this.addWindowListener("resetCamera", () => {
      this.centerCameraOnGrid()
    })
  }

  private panCamera(deltaX: number, deltaY: number) {
    const cam = this.cameras.main
    cam.scrollX += deltaX / cam.zoom
    cam.scrollY += deltaY / cam.zoom
  }

  update() {
    if (this.inputBlocked || !this.cursors) return

    if (this.cursors.up.isDown) {
      this.panCamera(0, -PAN_SPEED)
    }
    if (this.cursors.down.isDown) {
      this.panCamera(0, PAN_SPEED)
    }
    if (this.cursors.left.isDown) {
      this.panCamera(-PAN_SPEED, 0)
    }
    if (this.cursors.right.isDown) {
      this.panCamera(PAN_SPEED, 0)
    }
  }

  private getTerrainColor(terrainType: TerrainType): number {
    const TERRAIN_COLORS: Record<string, number> = {
      grass: 0x2d5a27,
      rock: 0x4a4a4a,
      water: 0x1a4d7a,
      sand: 0x8b7355,
    }

    return TERRAIN_COLORS[terrainType] ?? 0x2d5a27
  }

  private processUpkeep() {
    this.buildings.forEach((building) => {
      if (this.isUnderConstruction(building)) {
        building.isActive = false
        return
      }

      if (!building.isPowered || building.type === "power_source" || building.type === "monolith") {
        if (building.type === "power_source") {
          building.isActive = true
        }
        return
      }

      const definition = BuildingRegistry.getBuilding(building.type)
      if (!definition) {
        building.isActive = false
        return
      }

      const upkeepOre = definition.stats.upkeepOre
      const upkeepMaterials = definition.stats.upkeepMaterials

      const canPayUpkeep = this.resources.rawOre >= upkeepOre && this.resources.buildingMaterials >= upkeepMaterials

      if (canPayUpkeep) {
        this.resources.rawOre = Math.floor(this.resources.rawOre - upkeepOre)
        this.resources.buildingMaterials = Math.floor(this.resources.buildingMaterials - upkeepMaterials)
        building.isActive = true

        // Production happens immediately after paying upkeep
        if (building.type === "factory") {
          this.resources.buildingMaterials = Math.floor(
            Math.min(
              this.resources.maxBuildingMaterials,
              this.resources.buildingMaterials + definition.stats.materialsProduction,
            ),
          )
        }

        if (building.type === "drill") {
          const tile = this.grid[building.tileY]?.[building.tileX]
          let oreProduction = definition.stats.oreProduction

          if (tile?.terrainType === "rock") {
            const rockBonus = TechRegistry.getGlobalModifier("drillRockBonus")
            oreProduction = Math.floor(oreProduction * (1 + rockBonus))
          }

          this.resources.rawOre = Math.floor(Math.min(this.resources.maxRawOre, this.resources.rawOre + oreProduction))
        }

        if (building.type === "uplink") {
          this.resources.dataUploaded = Math.floor(
            Math.min(this.resources.maxDataUploaded, this.resources.dataUploaded + definition.stats.dataUploadRate),
          )
        }
      } else {
        building.isActive = false
      }
    })

    this.updateActiveVisuals()
  }

  private setupTechListener() {
    const handleSpendData = (e: CustomEvent<{ amount: number; nodeId?: string }>) => {
      this.resources.dataUploaded = Math.max(0, this.resources.dataUploaded - e.detail.amount)
      this.emitGameState()
    }
    this.addWindowListener("spendData", handleSpendData)

    const handleTechUnlocked = () => {
      this.applyTechBonuses()
      this.refreshBuildingStats()
      this.updatePowerNetwork()
      this.emitGameState()
    }
    this.addWindowListener("techUnlocked", handleTechUnlocked)
  }

  private applyTechBonuses() {
    const baseMaxOre = 500
    const baseMaxMaterials = 500

    this.resources.maxRawOre = baseMaxOre + TechRegistry.getResourceBonus("maxRawOre")
    this.resources.maxBuildingMaterials = baseMaxMaterials + TechRegistry.getResourceBonus("maxBuildingMaterials")
  }

  private progressConstruction() {
    this.buildings.forEach((building) => {
      if (building.buildProgress < building.buildTime) {
        building.buildProgress++
        this.updateConstructionVisuals(building)
      }
    })
  }

  private isUnderConstruction(building: Building): boolean {
    return building.buildProgress < building.buildTime
  }

  private updateConstructionVisuals(building: Building) {
    const container = this.buildingSprites.get(building.id)
    if (!container) return

    const isBuilding = this.isUnderConstruction(building)

    // Update or create progress bar
    let progressBar = container.getByName("progressBar") as Phaser.GameObjects.Rectangle
    let progressBg = container.getByName("progressBg") as Phaser.GameObjects.Rectangle

    if (isBuilding) {
      const definition = BuildingRegistry.getBuilding(building.type)
      const size = definition?.visuals.size || 24
      const progress = building.buildProgress / building.buildTime

      if (!progressBg) {
        progressBg = this.add.rectangle(0, size / 2 + 4, size, 4, 0x333333)
        progressBg.setName("progressBg")
        container.add(progressBg)
      }

      if (!progressBar) {
        progressBar = this.add.rectangle(-size / 2, size / 2 + 4, 0, 4, 0x00ffff)
        progressBar.setOrigin(0, 0.5)
        progressBar.setName("progressBar")
        container.add(progressBar)
      }

      progressBar.setSize(size * progress, 4)

      // Dim the building while under construction
      const base = container.first as Phaser.GameObjects.Rectangle
      if (base) {
        base.setAlpha(0.4)
      }
    } else {
      // Remove progress bar when complete
      if (progressBar) {
        progressBar.destroy()
      }
      if (progressBg) {
        progressBg.destroy()
      }
    }
  }
}
