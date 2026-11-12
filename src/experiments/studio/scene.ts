import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { appSize, collarColumns, makeStudioScarfChapters, makeStudioScarfLanding, makeStudioScarfPose, markDockStart, projectOutsideBox, scarfRows, scarfSegments, stageStudioScarf, stageStudioScarfChapters, studioApp, studioCameraPose, studioCollarTrim, studioDrapeFloor, studioFinaleDockOpacity, studioFinaleEnd, studioFinaleMark, studioFinaleStart, studioFinaleTransform, studioFinaleWrap, studioFov, studioMark, studioMarkDock, studioMarkHalf, studioQuotaCardDepth } from './pose.ts'
import { STUDIO_SCROLL_HANDOFF, studioHandoffPhase } from './chapters.ts'
import { createMarkOccluder, markFaceDepth, markImageSize, markWorldSize } from './mark.ts'
import { createScarfMesh } from './scarf-mesh.ts'

const scarfColumns = scarfSegments + 1
const freeColumns = scarfSegments - collarColumns
const woolRepeat = .48
const appHalf = new THREE.Vector3(appSize.width / 2 + .12, appSize.height / 2 + .12, .23)
const scarfClearanceY = -5.02
const gustDuration = 1.55

export function studioScarfGustPhase(quiet: number, chapter: number) {
  const afterWait = quiet - (2.35 + .24 * (chapter % 4))
  const phase = (afterWait % (8.35 + .53 * (chapter % 5))) / gustDuration
  return phase > 0 && phase < 1 ? phase : 0
}

type ScarfGust = { phase: number; column: number; edge: number; floorHeight: number }

export function clearStudioCardEdge(positions: Float32Array, camera: THREE.Camera, depth: number, card: THREE.Box2, offsets: Float32Array, grip: number | null = null, pull = 1) {
  if (grip !== null && !pull) return
  const point = new THREE.Vector3()
  const previous = new THREE.Vector3()
  const first = studioCollarTrim(1)
  const span = 26
  const centerX = (card.min.x + card.max.x) / 2
  const smooth = THREE.MathUtils.smoothstep
  offsets.fill(0)
  for (let column = first; column < scarfColumns; column++) {
    let pushRight = 0, pushUp = 0
    for (let row = 0; row <= scarfRows; row++) {
      point.fromArray(positions, (row * scarfColumns + column) * 3).applyMatrix4(camera.matrixWorldInverse)
      const approach = 1 - smooth(Math.abs(point.z + depth), .36, 3)
      if (!approach) continue
      const projection = -depth / point.z
      const x = point.x * projection, y = point.y * projection
      const height = 1 - smooth(Math.max(card.min.y - y, y - card.max.y), .07, .42)
      const side = smooth(x, centerX - .2, centerX + .2)
      const right = Math.max(0, card.max.x + .075 - x)
      const top = Math.max(0, card.max.y + .075 - y)
      const turn = smooth(top - right, -.3, .3)
      const topWidth = 1 - smooth(card.min.x - x, .07, .42)
      pushRight = Math.max(pushRight, right * Math.min(1, 2 * turn) * approach * height * side)
      pushUp = Math.max(pushUp, top * Math.min(1, 2 * (1 - turn)) * approach * topWidth)
      if (grip !== null && column > first) {
        previous.fromArray(positions, (row * scarfColumns + column - 1) * 3).applyMatrix4(camera.matrixWorldInverse)
        const crossing = (-depth - previous.z) / (point.z - previous.z)
        if (crossing >= 0 && crossing <= 1) {
          previous.lerp(point, crossing)
          if (previous.x > card.min.x && previous.x < card.max.x && previous.y > card.min.y && previous.y < card.max.y) {
            const rightEdge = card.max.x + .15 - previous.x, topEdge = card.max.y + .15 - previous.y
            if (rightEdge <= topEdge) pushRight = Math.max(pushRight, rightEdge)
            else pushUp = Math.max(pushUp, topEdge)
          }
        }
      }
    }
    if (!pushRight && !pushUp) continue
    // Move the neighboring columns with the bend so the card edge cannot pinch the cloth.
    for (let neighbor = Math.max(first, column - span); neighbor <= Math.min(scarfSegments, column + span); neighbor++) {
      const weight = 1 - smooth(Math.abs(neighbor - column), 0, span)
      offsets[neighbor] = Math.max(offsets[neighbor], pushRight * weight)
      offsets[scarfColumns + neighbor] = Math.max(offsets[scarfColumns + neighbor], pushUp * weight)
    }
  }
  const view = camera.matrixWorldInverse.elements, world = camera.matrixWorld.elements
  for (let column = first; column < scarfColumns; column++) {
    const clearance = grip === null ? 1 : smooth(Math.abs(column - grip), 2.6, 11) * pull
    const right = offsets[column] * clearance, up = offsets[scarfColumns + column] * clearance
    if (!right && !up) continue
    for (let row = 0; row <= scarfRows; row++) {
      const i = (row * scarfColumns + column) * 3
      const ratio = -(view[2] * positions[i] + view[6] * positions[i + 1] + view[10] * positions[i + 2] + view[14]) / depth
      positions[i] += (world[0] * right + world[4] * up) * ratio
      positions[i + 1] += (world[1] * right + world[5] * up) * ratio
      positions[i + 2] += (world[2] * right + world[6] * up) * ratio
    }
  }
}

export function stageStudioProduct(product: THREE.Group, progress: number, aspect: number) {
  const { lerp, smoothstep } = THREE.MathUtils
  const portrait = 1 - smoothstep(aspect, .45, 1.05)
  const start = lerp(.43, .56, portrait)
  // Lift the window from the passing lower fold, inside the scarf's collision envelope.
  const carry = 1 - smoothstep(progress, start, lerp(.84, .94, portrait))
  product.position.set(studioApp.x - .15 * carry, studioApp.y - .32 * carry, studioApp.z)
  product.scale.setScalar(1 - .11 * carry)
  return smoothstep(progress, start, lerp(.77, .90, portrait))
}

/** Put the grip in front of nearby solids without changing its screen position. */
export function routeScarfGrip(target: THREE.Vector3, ray: THREE.Ray, boardVisible: boolean, markVisible = true, markCenter = studioMark, floorHeight = scarfClearanceY) {
  const initialDepth = ray.origin.distanceTo(target)
  let depth = initialDepth
  if (target.y < floorHeight + .43 && ray.direction.y < 0) {
    depth = Math.min(depth, (floorHeight + .43 - ray.origin.y) / ray.direction.y)
  }
  for (const [center, half, visible] of [[markCenter, studioMarkHalf, markVisible], [studioApp, appHalf, boardVisible]] as const) {
    if (!visible) continue
    const nearDepth = (center.z + half.z + .56 - ray.origin.z) / ray.direction.z
    if (nearDepth <= 0 || nearDepth >= depth) continue
    const x = ray.origin.x + ray.direction.x * nearDepth
    const y = ray.origin.y + ray.direction.y * nearDepth
    const edgeDistance = Math.max(Math.abs(x - center.x) - half.x, Math.abs(y - center.y) - half.y)
    const blend = 1 - THREE.MathUtils.smoothstep(edgeDistance, .45, 1)
    depth = Math.min(depth, THREE.MathUtils.lerp(initialDepth, nearDepth, blend))
  }
  return ray.at(depth, target)
}

// shortcut: long pulls can stretch the ribbon, add length constraints if physical knotting is needed.
export function createStudioScarfMotion(rest: Float32Array) {
  const positions = rest.slice()
  const snapshot = rest.slice()
  const grabRest = rest.slice()
  const origin = new THREE.Vector3()
  const offset = new THREE.Vector3()
  const trailingOffset = new THREE.Vector3()
  const dragLag = new THREE.Vector3()
  const point = new THREE.Vector3()
  const releasedPoint = new THREE.Vector3()
  const deformation = new THREE.Vector3()
  const pinchPivot = new THREE.Vector3()
  let gripColumn: number | null = null
  let gripRow = scarfRows / 2
  let releaseWeight = 0
  let hoverColumn = 0
  let hoverTarget: number | null = null
  let hoverRow = .5
  let hoverRowTarget = .5
  let hoverWeight = 0
  let ambientWeight = 0
  let elapsed = 0

  return {
    positions,
    get grabbedColumn() { return gripColumn },
    get pullDistance() { return offset.length() },
    get interacting() { return gripColumn !== null || hoverTarget !== null || hoverWeight > .04 || releaseWeight > .01 },
    startGrab(u: number, hit: THREE.Vector3, v = .5) {
      gripColumn = u * scarfSegments
      gripRow = v * scarfRows
      grabRest.set(rest)
      origin.copy(hit)
      offset.set(0, 0, 0)
      trailingOffset.set(0, 0, 0)
      snapshot.set(positions)
      hoverTarget = null
    },
    moveGrab(target: THREE.Vector3) { offset.copy(target).sub(origin) },
    endGrab() {
      if (gripColumn === null) return
      gripColumn = null
      snapshot.set(positions)
      releaseWeight = 1
    },
    hover(u: number | null, v = .5) {
      hoverTarget = u === null ? null : u * scarfSegments
      hoverRowTarget = v
      if (hoverWeight < .01 && hoverTarget !== null) {
        hoverColumn = hoverTarget
        hoverRow = v
      }
    },
    reset() {
      positions.set(rest)
      gripColumn = null
      releaseWeight = hoverWeight = ambientWeight = elapsed = 0
      hoverTarget = null
    },
    step(dt: number, ambient: number, boardVisible: boolean, immediate: boolean, markVisible = true, chapter = 0, markCenter = studioMark, featureHover = chapter, gust?: ScarfGust, floorHeight = scarfClearanceY) {
      const { clamp, damp, lerp, smoothstep } = THREE.MathUtils
      const activeGust = !immediate && gust?.phase ? gust : undefined
      const freeHem = studioCollarTrim(1)
      elapsed += dt
      ambientWeight = immediate || gust ? 0 : damp(ambientWeight, ambient, 9, dt)
      releaseWeight = immediate || releaseWeight < .0005 ? 0 : releaseWeight * Math.exp(-8 * dt)
      const hoverStrength = hoverTarget === null || ambient === 0 ? 0 : Math.max(ambient, .54 * chapter, .70 * featureHover)
      const hoverRate = lerp(13, hoverStrength ? 26 : 9, featureHover)
      hoverWeight = immediate ? 0 : damp(hoverWeight, hoverStrength, hoverRate, dt)
      if (hoverTarget !== null) {
        hoverColumn = damp(hoverColumn, hoverTarget, lerp(18, 25, featureHover), dt)
        hoverRow = damp(hoverRow, hoverRowTarget, 18, dt)
      }
      const pullDistance = offset.length()
      const tension = Math.min(.48, pullDistance * .052)
      const bend = 1 - Math.exp(-pullDistance * .85)
      const bottom = gripColumn === null ? scarfClearanceY : floorHeight
      trailingOffset.lerp(offset, 1 - Math.exp(-9 * dt))
      dragLag.copy(trailingOffset).sub(offset)
      for (let row = 0; row <= scarfRows; row++) {
        const first = row * scarfColumns * 3
        positions.set(rest.subarray(first, first + (collarColumns + 1) * 3), first)
      }
      for (let column = collarColumns + 1; column <= scarfSegments; column++) {
        const along = (column - collarColumns) / freeColumns
        const moving = smoothstep(along, 0, .14)
        const wind = ambientWeight * moving * THREE.MathUtils.lerp(1 - smoothstep(along, .38, .68), .25 + .42 * along, chapter)
        const wave = elapsed * 2.3 - along * 9.6
        const distance = activeGust ? Math.abs(column - activeGust.column) / 33 : 1
        const ripple = activeGust && distance < 1
          ? .18 * (1 - smoothstep(distance, 0, 1)) * Math.sin(Math.PI * clamp(activeGust.phase * 1.18 - .18 * distance, 0, 1)) ** 2
          : 0
        const freeTravel = (column - freeHem) / (scarfSegments - freeHem)
        const gustTravel = activeGust && activeGust.column > (freeHem + scarfSegments) / 2 ? 1 - freeTravel : freeTravel
        const gustPhase = activeGust ? clamp(activeGust.phase * 1.65 - .65 * gustTravel, 0, 1) : 0
        const clearance = activeGust && gustPhase
          ? Math.min(rest[column * 3 + 1], rest[(scarfRows * scarfColumns + column) * 3 + 1]) - activeGust.floorHeight : 0
        const suspended = smoothstep(clearance, .06, .28)
        const shelter = 1 - .95 * smoothstep(clearance, 2, 3.6)
        const gustPulse = gustPhase ? Math.sin(Math.PI * gustPhase) ** 2 * smoothstep(freeTravel, 0, .16) * shelter * (markVisible ? .64 : 1) : 0
        const sway = gustPulse ? Math.sin(2 * Math.PI * gustPhase) : 0
        const hover = hoverWeight * moving * (1 - smoothstep(Math.abs(column - hoverColumn) / freeColumns, 0, .12 + .025 * featureHover))
        const brush = hover * featureHover
        const fromGrip = gripColumn === null ? 0 : Math.abs(column - gripColumn)
        const leavingGrip = smoothstep(fromGrip, 2.6, freeColumns * .115)
        const grip = gripColumn === null ? 0 : smoothstep(column, collarColumns, gripColumn - 2.6)
        const pullSpan = freeColumns * (.38 + tension)
        const carry = grip * (1 - smoothstep(fromGrip, 2.6, pullSpan))
        // Keep the picked patch exact while the surrounding fabric follows the current scroll pose.
        const scrub = smoothstep(fromGrip, 2.6, freeColumns * .27)
        const lag = carry * leavingGrip * .90
        const sag = bend * Math.sin(carry * Math.PI) * .38
        const gathering = .42 * bend * carry * (1 - smoothstep(fromGrip, 2.6, freeColumns * .21))
        if (gathering) {
          const low = Math.floor(gripRow)
          pinchPivot.fromArray(snapshot, (low * scarfColumns + column) * 3)
            .lerp(deformation.fromArray(snapshot, (Math.min(low + 1, scarfRows) * scarfColumns + column) * 3), gripRow - low)
        }
        for (let row = 0; row <= scarfRows; row++) {
          const index = (row * scarfColumns + column) * 3
          if (gripColumn !== null) {
            point.fromArray(snapshot, index)
              .addScaledVector(deformation.fromArray(rest, index).sub(releasedPoint.fromArray(grabRest, index)), scrub)
            const across = (row - gripRow) / scarfRows
            const pinch = gathering * (1 - (1 - leavingGrip) * (1 - smoothstep(Math.abs(across), .21, .48)))
            point.lerp(pinchPivot, pinch).addScaledVector(offset, carry)
              .addScaledVector(dragLag, lag)
            point.y -= sag * .64 + pinch * Math.abs(across) * .45
            point.z += sag * .38 + pinch * across * .46
          } else {
            point.fromArray(rest, index)
            // Lift the local fold and tip the edge nearest the pointer toward the camera.
            const across = row / scarfRows - .5
            const tip = 2 * across * (hoverRow - .5)
            const lift = ripple * (activeGust?.edge === 0 ? .5 - across : .5 + across) ** 3
            // Grounded folds hold their weight while the raised fabric catches the traveling breeze.
            const raised = activeGust && gustPulse ? smoothstep(point.y - activeGust.floorHeight, .075, .30) : 0
            const breeze = gustPulse * Math.max(suspended, raised * .62)
            point.x += wind * .085 * Math.sin(wave * .77) + breeze * .17 * sway
            point.y += wind * .255 * Math.sin(wave) + hover * .29 + brush * (.24 + .14 * tip) + lift + breeze * (.35 + .17 * across * sway)
            point.z += wind * .32 * Math.sin(wave - 1.1) + hover * (.44 + chapter * .32 * across) + brush * (.14 + .68 * tip) + lift * .16 + breeze * (.21 * sway + .11 * across)
            if (releaseWeight) point.lerp(releasedPoint.fromArray(snapshot, index), releaseWeight)
          }
          if (boardVisible) projectOutsideBox(point, studioApp, appHalf)
          if (markVisible) projectOutsideBox(point, markCenter, studioMarkHalf)
          point.y = Math.max(point.y, Math.min(bottom, rest[index + 1]))
          point.toArray(positions, index)
        }
      }
    },
  }
}

export function createStudioScene(host: HTMLElement, assets: { app: string; wool: string; character: HTMLElement; dock: HTMLImageElement; featureCard?: () => HTMLElement | null }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const canvas = renderer.domElement
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;'
  canvas.tabIndex = 0
  canvas.setAttribute('aria-label', 'Donvis 红围巾三维展示。拖动围巾，或用方向键拉动，Escape 松开。')
  canvas.setAttribute('aria-describedby', 'studio-instructions')
  canvas.dataset.grabbing = 'false'
  canvas.dataset.grabs = '0'
  host.append(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(studioFov, 1, .1, 100)
  const launchCamera = camera.clone()
  const markUnit = markWorldSize / markImageSize
  const markWorld = new THREE.Matrix4().makeScale(markUnit, -markUnit, 1).setPosition(
    studioMark.x - markWorldSize / 2, studioMark.y + markWorldSize / 2, studioMark.z + markFaceDepth,
  )
  const viewport = new THREE.Matrix4()
  const characterTransform = new THREE.Matrix4()
  const launchTransform = new THREE.Matrix4()
  const dockTransform = new THREE.Matrix4()
  const returnWorld = new THREE.Matrix4()
  const returnTransform = new THREE.Matrix4()
  const markCenter = studioMark.clone()
  let dockLift = 0
  let returnLift = 0
  const compactLayout = matchMedia('(max-width: 760px), (max-aspect-ratio: 3/2)')
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const environment = pmrem.fromScene(room, .04)
  scene.environment = environment.texture
  scene.environmentIntensity = .21
  room.dispose()
  pmrem.dispose()
  scene.add(new THREE.HemisphereLight('#fff4ed', '#8e635d', .58))
  const key = new THREE.DirectionalLight('#fff8f2', 2.45)
  key.position.set(-5, 7, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -12; key.shadow.camera.right = 18
  key.shadow.camera.top = 10; key.shadow.camera.bottom = -10
  key.shadow.bias = -.00015
  key.shadow.normalBias = .012
  key.shadow.radius = 3
  scene.add(key)
  const rim = new THREE.DirectionalLight('#ffd1bc', 1.05)
  rim.position.set(6, 4, -5)
  scene.add(rim)

  let poseAspect = host.clientWidth / Math.max(1, host.clientHeight)
  let poseCompact = compactLayout.matches
  const pose = makeStudioScarfPose(poseAspect, poseCompact)
  const scarfMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 1, sheen: .85,
    sheenColor: '#b54b43', sheenRoughness: .94, specularIntensity: .04, bumpScale: .05,
  })
  const rest = pose.positions.slice()
  let landingPose = makeStudioScarfLanding(pose.positions, poseAspect, poseCompact)
  let chapterPoses = makeStudioScarfChapters(landingPose, poseAspect, poseCompact)
  const cloth = createStudioScarfMotion(rest)
  const shell = createScarfMesh(cloth.positions, scarfSegments, scarfRows, scarfMaterial)
  const scarf = shell.mesh
  scarf.frustumCulled = false
  scarf.castShadow = true
  scarf.receiveShadow = true
  scene.add(scarf)
  const head = createMarkOccluder()
  head.position.copy(studioMark).z += markFaceDepth
  scene.add(head)
  // Match the live card's silhouette in the depth buffer so the rear fold is hidden behind its DOM surface.
  const featureCard = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ colorWrite: false }))
  featureCard.renderOrder = -1
  featureCard.visible = false
  const cardBounds = new THREE.Box2()
  const cardOffsets = new Float32Array(scarfColumns * 2)
  let cardDepth = 0
  scene.add(featureCard)

  const boardMaterial = new THREE.MeshStandardMaterial({ color: '#c5bdaf', roughness: .92, metalness: 0 })
  const product = new THREE.Group()
  product.position.copy(studioApp)
  scene.add(product)
  const board = new THREE.Mesh(new RoundedBoxGeometry(appSize.width + .08, appSize.height + .08, .18, 3, .06), boardMaterial)
  board.castShadow = true
  board.visible = false
  product.add(board)
  let app: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ color: '#514b40', opacity: .12 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -5.15
  floor.receiveShadow = true
  scene.add(floor)
  const drapeFloor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ color: '#514b40', opacity: 0, depthWrite: false }))
  drapeFloor.rotation.copy(floor.rotation)
  drapeFloor.position.y = studioDrapeFloor - .045
  drapeFloor.receiveShadow = true
  drapeFloor.visible = false
  scene.add(drapeFloor)

  let disposed = false
  let woolTexture: THREE.Texture | undefined
  let appTexture: THREE.Texture | undefined
  const loader = new THREE.TextureLoader()
  const woolReady = loader.loadAsync(assets.wool).then(texture => {
    if (disposed) { texture.dispose(); return }
    woolTexture = texture
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.rotation = Math.PI / 2
    texture.repeat.set(woolRepeat, woolRepeat * pose.length / pose.width)
    scarfMaterial.map = scarfMaterial.bumpMap = texture
    scarfMaterial.needsUpdate = true
  })
  const appReady = loader.loadAsync(assets.app).then(texture => {
    if (disposed) { texture.dispose(); return }
    appTexture = texture
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    app = new THREE.Mesh(new THREE.PlaneGeometry(appSize.width, appSize.height), new THREE.MeshBasicMaterial({ map: appTexture, toneMapped: false }))
    app.position.z = .102
    product.add(app)
    updateReveal()
  })
  const ready = Promise.all([woolReady, appReady])

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2(3, 3)
  const point = new THREE.Vector3()
  const grabTarget = new THREE.Vector3()
  const dragAnchor = new THREE.Vector3()
  const keyboardTarget = new THREE.Vector3()
  const dragPlane = new THREE.Plane()
  let dragging: number | null = null
  let keyboardGrab = false
  let touchDrag = false
  let pointerPresent = false
  let hoverDirty = false
  let progress = 0
  let chapterProgress = 0
  let boardSolid = false
  let last = 0
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let userPaused = false
  let quiet = 0
  const gust: ScarfGust = { phase: 0, column: -scarfColumns, edge: 1, floorHeight: studioDrapeFloor }

  function chooseGustEdge() {
    const first = studioCollarTrim(1)
    gust.floorHeight = chapterProgress === 0 ? floor.position.y : studioDrapeFloor
    const closing = chapterProgress > studioFinaleStart
    let score = -Infinity
    gust.column = -scarfColumns
    for (let column = first; column <= scarfSegments; column += 2) {
      const firstEdge = rest[column * 3 + 1]
      const lastEdge = rest[(scarfRows * scarfColumns + column) * 3 + 1]
      if (!closing && Math.min(firstEdge, lastEdge) > gust.floorHeight + .44) continue
      const edge = firstEdge > lastEdge ? 0 : 1
      point.fromArray(rest, (edge * scarfRows * scarfColumns + column) * 3).project(camera)
      if (Math.abs(point.x) > .96 || point.y < -.96 || point.y > -.18) continue
      const middleDistance = Math.abs(column - (first + scarfSegments) / 2)
      const rank = -middleDistance / 100 - point.y * .28
      if (rank <= score) continue
      score = rank
      gust.column = column
      gust.edge = edge
    }
  }

  function finish() {
    const id = dragging
    dragging = null
    keyboardGrab = false
    pointerPresent = false
    hoverDirty = false
    cloth.endGrab()
    cloth.hover(null)
    canvas.dataset.grabbing = 'false'
    canvas.style.cursor = 'default'
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id)
  }
  function positionCamera(camera: THREE.PerspectiveCamera, progress: number) {
    const next = studioCameraPose(progress, camera.aspect, compactLayout.matches)
    camera.position.copy(next.position)
    camera.up.set(Math.sin(next.roll), Math.cos(next.roll), 0)
    camera.lookAt(next.target)
    camera.updateMatrixWorld()
  }
  function flyCharacter(from: THREE.Matrix4, to: THREE.Matrix4, phase: number, lift: number) {
    const values = characterTransform.elements
    for (let i = 0; i < values.length; i++) values[i] = THREE.MathUtils.lerp(from.elements[i], to.elements[i], phase)
    values[13] -= Math.sin(Math.PI * phase) * lift
  }
  function updateCamera() {
    positionCamera(camera, progress)
    updateScarfPose()
    const dock = studioMarkDock(progress)
    const finaleVisible = studioFinaleDockOpacity(chapterProgress) > 0
    const returning = studioFinaleMark(chapterProgress)
    const arrived = returning === 1
    const wrap = studioFinaleWrap(chapterProgress)
    head.visible = dock < .12 || arrived
    markCenter.copy(studioMark)
    head.position.copy(studioMark).z += markFaceDepth
    if (arrived) {
      markCenter.applyMatrix4(returnWorld)
      head.position.applyMatrix4(returnWorld)
      head.quaternion.setFromRotationMatrix(returnWorld)
    } else head.quaternion.identity()
    shell.retractCollar(studioCollarTrim(progress) * (1 - wrap))
    if (dock === 1 && !finaleVisible) return
    if (dock === 0) {
      characterTransform.copy(viewport).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(markWorld)
    } else if (finaleVisible) {
      flyCharacter(dockTransform, returnTransform, returning, returnLift)
    } else {
      flyCharacter(launchTransform, dockTransform, dock, dockLift)
    }
    assets.character.style.transform = `matrix3d(${characterTransform.elements.join(',')})`
  }
  function updateScarfPose() {
    if (progress === 1 && chapterProgress > 0) stageStudioScarfChapters(rest, chapterPoses, chapterProgress)
    else stageStudioScarf(rest, pose.positions, landingPose, progress)
  }
  function updateReveal() {
    const opacity = stageStudioProduct(product, progress, poseAspect)
      * (1 - THREE.MathUtils.smoothstep(chapterProgress, .205, .29))
    board.visible = opacity > 0
    boardSolid = board.visible
    const { smoothstep, lerp } = THREE.MathUtils
    const overviewShade = lerp(.12 * (1 - .64 * smoothstep(progress, .72, 1)), .12, smoothstep(progress, .90, 1))
    floor.material.opacity = overviewShade * (1 - smoothstep(chapterProgress, .04, .26))
    const phase = chapterProgress < 1 ? chapterProgress : studioHandoffPhase(chapterProgress % 1)
    const settled = smoothstep(phase, .49, chapterProgress < 1 ? .55 : .63)
    const departing = chapterProgress >= 1 ? 1 - smoothstep(phase, .035, .19) : 0
    const closing = 1 - smoothstep(chapterProgress, studioFinaleStart + .035, studioFinaleStart + .20)
    drapeFloor.material.opacity = .22 * Math.max(settled, departing) * closing
    drapeFloor.visible = drapeFloor.material.opacity > 0
    board.castShadow = progress < 1 || opacity >= .96
    boardMaterial.transparent = opacity < 1
    boardMaterial.opacity = opacity
    boardMaterial.depthWrite = opacity >= 1
    if (app) {
      app.visible = opacity > 0
      app.material.transparent = opacity < 1
      app.material.opacity = opacity
      app.material.depthWrite = opacity >= 1
    }
    const label = progress >= .8 && board.visible
      ? 'Donvis 的 Codex 分析界面和红围巾三维展示。拖动围巾，或用方向键拉动，Escape 松开。'
      : 'Donvis 红围巾三维展示。拖动围巾，或用方向键拉动，Escape 松开。'
    if (canvas.getAttribute('aria-label') !== label) canvas.setAttribute('aria-label', label)
  }
  function updateFeatureCard() {
    const phase = studioHandoffPhase(chapterProgress % 1)
    const { smoothstep, lerp } = THREE.MathUtils
    const wrap = chapterProgress < 2 ? smoothstep(phase, .49, .63) : 1 - smoothstep(phase, .13, .31)
    const element = chapterProgress > 1 && chapterProgress < 2.6 && wrap > 0 ? assets.featureCard?.() : null
    featureCard.visible = !!element
    if (!element) return
    const bounds = element.getBoundingClientRect()
    const view = canvas.getBoundingClientRect()
    const depth = cardDepth = lerp(17, studioQuotaCardDepth, wrap)
    const unit = 2 * depth * Math.tan(THREE.MathUtils.degToRad(studioFov / 2)) / view.height
    const left = (bounds.left - view.left - view.width / 2) * unit
    const top = (view.top + view.height / 2 - bounds.top) * unit
    const width = bounds.width * unit, height = bounds.height * unit
    cardBounds.min.set(left, top - height)
    cardBounds.max.set(left + width, top)
    featureCard.position.set(left + width / 2, top - height / 2, -depth)
    featureCard.position.applyMatrix4(camera.matrixWorld)
    featureCard.quaternion.copy(camera.quaternion)
    featureCard.scale.set(width, height, 1)
    featureCard.updateMatrixWorld()
  }
  function resize() {
    finish()
    const rect = host.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const aspect = rect.width / rect.height
    if (Math.abs(aspect - poseAspect) > .005 || poseCompact !== compactLayout.matches) {
      poseAspect = aspect
      poseCompact = compactLayout.matches
      const next = makeStudioScarfPose(aspect, poseCompact)
      pose.positions.set(next.positions)
      pose.length = next.length
      pose.width = next.width
      landingPose = makeStudioScarfLanding(pose.positions, poseAspect, poseCompact)
      chapterPoses = makeStudioScarfChapters(landingPose, poseAspect, poseCompact)
      updateScarfPose()
      cloth.reset()
      woolTexture?.repeat.set(woolRepeat, woolRepeat * pose.length / pose.width)
    }
    const pixelRatio = Math.max(1, Math.min(devicePixelRatio, 2, Math.sqrt(5_000_000 / (rect.width * rect.height))))
    if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio)
    renderer.setSize(rect.width, rect.height, false)
    const halfWidth = rect.width / 2, halfHeight = rect.height / 2
    viewport.set(halfWidth, 0, 0, halfWidth, 0, -halfHeight, 0, halfHeight, 0, 0, 1, 0, 0, 0, 0, 1)
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    launchCamera.aspect = aspect
    launchCamera.updateProjectionMatrix()
    positionCamera(launchCamera, markDockStart)
    launchTransform.copy(viewport).multiply(launchCamera.projectionMatrix).multiply(launchCamera.matrixWorldInverse).multiply(markWorld)
    launchTransform.multiplyScalar(1 / launchTransform.elements[15])
    const landing = assets.dock.getBoundingClientRect()
    const scale = landing.width / markImageSize
    dockTransform.makeScale(scale, scale, 1).setPosition(landing.left - rect.left, landing.top, 0)
    dockLift = Math.min(52, landing.top + 10, rect.height * .065)
    returnLift = Math.min(34, rect.height * .042)
    returnWorld.copy(studioFinaleTransform(aspect, compactLayout.matches))
    positionCamera(camera, 1)
    returnTransform.copy(viewport).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(returnWorld).multiply(markWorld)
    returnTransform.multiplyScalar(1 / returnTransform.elements[15])
    updateCamera()
    updateReveal()
  }
  function updatePointer(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
  }
  function pick() {
    const hit = raycaster.intersectObject(scarf, false)[0]
    const firstFree = progress === 1 && studioFinaleMark(chapterProgress) < 1 ? studioCollarTrim(progress) : collarColumns + .13 * freeColumns
    if (!hit || !hit.uv || hit.uv.x < firstFree / scarfSegments) return
    const solid = raycaster.intersectObjects([head, board, featureCard].filter(object => object === board ? boardSolid : object.visible), true)[0]
    if (solid && solid.distance < hit.distance) return
    return hit
  }
  function routeGrab(target: THREE.Vector3) {
    const { ray } = raycaster
    const { smoothstep } = THREE.MathUtils
    const routing = dragging === null ? 1 : smoothstep(target.distanceTo(dragAnchor), .015, .48)
    if (!routing) return target
    const requestedDistance = ray.origin.distanceTo(target)
    const floorHeight = drapeFloor.visible ? studioDrapeFloor : scarfClearanceY
    routeScarfGrip(target, ray, boardSolid, head.visible, markCenter, floorHeight)
    if (featureCard.visible) {
      point.copy(target).applyMatrix4(camera.matrixWorldInverse)
      const depth = -point.z
      if (depth > cardDepth - .58) {
        const x = point.x * cardDepth / depth, y = point.y * cardDepth / depth
        const edge = Math.max(cardBounds.min.x - x, x - cardBounds.max.x, cardBounds.min.y - y, y - cardBounds.max.y)
        const weight = 1 - smoothstep(edge, .10, .82)
        target.lerp(ray.origin, weight * (1 - (cardDepth - .58) / depth))
      }
    }
    // Keep the material at its picked depth until the pointer actually starts pulling.
    return routing < 1 ? target.lerp(ray.at(requestedDistance, point), 1 - routing) : target
  }
  function updateGrab() {
    if (dragging === null) return
    raycaster.setFromCamera(pointer, camera)
    if (raycaster.ray.intersectPlane(dragPlane, grabTarget)) {
      cloth.moveGrab(routeGrab(grabTarget))
    }
  }
  function down(event: PointerEvent) {
    if ((event.pointerType === 'touch' && !touchDrag) || event.button !== 0 || dragging !== null) return
    updatePointer(event)
    raycaster.setFromCamera(pointer, camera)
    const hit = pick()
    if (!hit?.uv) return
    keyboardGrab = false
    cloth.startGrab(hit.uv.x, hit.point, hit.uv.y)
    dragAnchor.copy(hit.point)
    dragging = event.pointerId
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(point), hit.point)
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
    canvas.dataset.grabbing = 'true'
    canvas.dataset.grabs = String(Number(canvas.dataset.grabs) + 1)
  }
  function move(event: PointerEvent) {
    if (dragging !== null && dragging !== event.pointerId) return
    updatePointer(event)
    if (dragging !== null) {
      updateGrab()
      return
    }
    pointerPresent = event.pointerType !== 'touch'
    hoverDirty = pointerPresent
    if (!pointerPresent) cloth.hover(null)
  }
  function updateHover() {
    raycaster.setFromCamera(pointer, camera)
    const hit = pick()
    cloth.hover(hit?.uv?.x ?? null, hit?.uv?.y)
    canvas.style.cursor = hit ? 'grab' : 'default'
  }
  function up(event: PointerEvent) { if (event.pointerId === dragging) finish() }
  function leave() {
    pointerPresent = false
    cloth.hover(null)
    if (dragging === null) canvas.style.cursor = 'default'
  }
  const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); finish(); return }
    if (!arrows.includes(event.key) || dragging !== null) return
    event.preventDefault()
    if (!keyboardGrab) {
      const column = Math.floor(scarfSegments * .4)
      keyboardTarget.fromArray(cloth.positions, (Math.floor(scarfRows / 2) * scarfColumns + column) * 3)
      cloth.startGrab(column / scarfSegments, keyboardTarget)
      keyboardGrab = true
      canvas.dataset.grabbing = 'true'
    }
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? .22 : -.22
    keyboardTarget.addScaledVector(point.setFromMatrixColumn(camera.matrixWorld, horizontal ? 0 : 1), direction)
    raycaster.ray.set(camera.position, point.copy(keyboardTarget).sub(camera.position).normalize())
    cloth.moveGrab(routeGrab(grabTarget.copy(keyboardTarget)))
  }
  function keyup(event: KeyboardEvent) { if (keyboardGrab && arrows.includes(event.key)) finish() }
  function visibility() { finish(); last = quiet = 0; gust.phase = 0 }
  function contextLost(event: Event) {
    event.preventDefault()
    finish()
    host.dispatchEvent(new CustomEvent('studio-error', { detail: '三维画面连接已中断，请刷新重试。' }))
  }
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('pointerleave', leave)
  canvas.addEventListener('lostpointercapture', finish)
  canvas.addEventListener('keydown', keydown)
  canvas.addEventListener('keyup', keyup)
  canvas.addEventListener('blur', finish)
  canvas.addEventListener('webglcontextlost', contextLost)
  window.addEventListener('blur', visibility)
  document.addEventListener('visibilitychange', visibility)
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  const viewportObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting
    if (!inViewport) visibility()
  })
  let inViewport = true
  viewportObserver.observe(host)
  resize()
  renderer.setAnimationLoop((now: number) => {
    if (disposed || document.hidden || !inViewport) { last = 0; return }
    const frameTime = last ? (now - last) / 1000 : 0
    const dt = Math.min(frameTime, .033)
    last = now
    const { smoothstep, damp } = THREE.MathUtils
    const chapterAmbient = smoothstep(chapterProgress, .42, .58) * (1 - studioFinaleMark(chapterProgress))
    const featureHover = chapterAmbient * (1 - smoothstep(chapterProgress, studioFinaleStart, studioFinaleStart + .14))
    const finaleIdle = smoothstep(studioFinaleWrap(chapterProgress), .94, 1)
    const ambient = userPaused ? 0 : Math.max(1 - smoothstep(progress, .55, .78), finaleIdle) + chapterAmbient * .14
    const local = chapterProgress % 1
    const settled = chapterProgress === 0
      || (chapterProgress < 1 ? local >= .55 : chapterProgress < studioFinaleStart
        ? local >= STUDIO_SCROLL_HANDOFF.rest || local <= STUDIO_SCROLL_HANDOFF.lead
        : finaleIdle === 1)
    const breezeAllowed = progress === 1 && settled && !userPaused && !motion.matches
    quiet = breezeAllowed && !cloth.interacting ? quiet + frameTime : 0
    // Finish a passing gust when the pointer enters, then wait for the cloth to be idle again.
    const nextPhase = gust.phase ? gust.phase + frameTime / gustDuration : studioScarfGustPhase(quiet, Math.floor(chapterProgress))
    const phase = breezeAllowed && nextPhase < 1 ? nextPhase : 0
    if (phase && !gust.phase) chooseGustEdge()
    gust.phase = phase
    const tilt = !pointerPresent || dragging !== null || keyboardGrab || userPaused || motion.matches
      ? 0 : smoothstep(progress, .75, .95) * (1 - smoothstep(chapterProgress, .14, .225))
        / Math.max(1, Math.abs(pointer.x) + Math.abs(pointer.y))
    // Keep every corner inside the existing collision clearance.
    product.rotation.x = damp(product.rotation.x, -.027 * pointer.y * tilt, 9, dt)
    product.rotation.y = damp(product.rotation.y, .027 * pointer.x * tilt, 9, dt)
    product.rotation.z = damp(product.rotation.z, -.012 * pointer.x * tilt, 9, dt)
    updateFeatureCard()
    updateGrab()
    cloth.step(dt, ambient, boardSolid, motion.matches, head.visible, chapterAmbient, markCenter, featureHover, progress === 1 ? gust : undefined,
      drapeFloor.visible ? studioDrapeFloor : scarfClearanceY)
    if (featureCard.visible) {
      clearStudioCardEdge(cloth.positions, camera, cardDepth, cardBounds, cardOffsets,
        cloth.grabbedColumn, smoothstep(cloth.pullDistance, .03, .55))
    }
    shell.update()
    if (hoverDirty && pointerPresent && dragging === null) {
      board.updateWorldMatrix(true, false)
      updateHover()
    }
    hoverDirty = false
    renderer.render(scene, camera)
  })
  return {
    ready,
    setProgress(value: number) {
      if (!Number.isFinite(value)) return
      const next = THREE.MathUtils.clamp(value, 0, 1)
      if (next === progress) return
      progress = next
      gust.phase = quiet = 0
      updateCamera()
      updateReveal()
      updateGrab()
      hoverDirty = true
    },
    setChapterProgress(value: number) {
      if (!Number.isFinite(value)) return
      const next = THREE.MathUtils.clamp(value, 0, studioFinaleEnd)
      if (next === chapterProgress) return
      const previous = chapterProgress
      chapterProgress = next
      gust.phase = quiet = 0
      if (next > studioFinaleStart || previous > studioFinaleStart) updateCamera()
      else updateScarfPose()
      updateReveal()
      updateGrab()
      hoverDirty = true
    },
    setPaused(value: boolean) { userPaused = value; cloth.hover(null) },
    setTouchDrag(value: boolean) { finish(); touchDrag = value; canvas.style.touchAction = value ? 'none' : 'pan-y' },
    reset() { finish(); cloth.reset() },
    dispose() {
      if (disposed) return
      disposed = true
      finish()
      observer.disconnect()
      viewportObserver.disconnect()
      renderer.setAnimationLoop(null)
      window.removeEventListener('blur', visibility)
      document.removeEventListener('visibilitychange', visibility)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('lostpointercapture', finish)
      canvas.removeEventListener('keydown', keydown)
      canvas.removeEventListener('keyup', keyup)
      canvas.removeEventListener('blur', finish)
      canvas.removeEventListener('webglcontextlost', contextLost)
      scene.traverse(object => {
        if (object instanceof THREE.InstancedMesh) object.dispose()
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) material.dispose()
        }
      })
      woolTexture?.dispose(); appTexture?.dispose()
      environment.dispose(); renderer.dispose(); canvas.remove()
    },
  }
}
