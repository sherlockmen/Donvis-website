import { CatmullRomCurve3, Color, MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import { STUDIO_HANDOFF, STUDIO_SCREEN_COUNT, studioHandoffPhase } from './chapters.ts'

export const studioMark = new Vector3(1.2, 1.1, 1.2)
export const studioMarkHalf = new Vector3(1.38, 1.75, .24)
export const studioApp = new Vector3(14, -.45, -3.1)
export const appSize = { width: 9, height: 8.1 }
export const studioFov = 38
export const studioDrapeFloor = -2.32
export const scarfSegments = 216
export const scarfRows = 12
export const collarColumns = 48
export const markDockStart = .10
export const studioFinaleStart = STUDIO_SCREEN_COUNT
export const studioFinaleEnd = studioFinaleStart + 1.39
const studioFinaleArrival = studioFinaleStart + .62

export function studioFinaleDockOpacity(progress: number) {
  return MathUtils.smootherstep(progress, studioFinaleStart + .04, studioFinaleStart + .12)
}

export function studioFinaleMark(progress: number) {
  return MathUtils.smootherstep(progress, studioFinaleStart + .27, studioFinaleArrival)
}

export function studioFinaleWrap(progress: number) {
  return MathUtils.smoothstep(progress, studioFinaleArrival, studioFinaleStart + 1.24)
}

export function studioMarkDock(progress: number) {
  return MathUtils.smoothstep(progress, markDockStart, .32)
}

export function studioCollarTrim(progress: number) {
  return (collarColumns + 4) * MathUtils.smootherstep(progress, .11, .33)
}

const opening = new Color('#f4c568')
const middle = new Color('#e6ba81')
const closing = new Color('#edf0e8')
export function studioBackground(progress: number) {
  return progress < .58
    ? opening.clone().lerp(middle, MathUtils.smoothstep(progress, .16, .58))
    : middle.clone().lerp(closing, MathUtils.smoothstep(progress, .58, 1))
}

export function makeStudioScarfPose(aspect = 1.78, compact = aspect <= 1.5, finale = false) {
  const iconPoint = (u: number, v: number, depth: number) => new Vector3(
    studioMark.x + (u - .5) * 4,
    studioMark.y + (.5 - v) * 4,
    studioMark.z + depth,
  )
  const neck = new CatmullRomCurve3([
    // The lower lap rolls forward across the first and lets the loose end out beneath the jaw.
    iconPoint(.707, .582, -.32), iconPoint(.771, .595, -.27),
    iconPoint(.803, .614, -.06), iconPoint(.798, .635, .22),
    iconPoint(.743, .651, .34), iconPoint(.655, .678, .38),
    iconPoint(.568, .710, .39), iconPoint(.479, .750, .35),
    iconPoint(.416, .776, .23), iconPoint(.385, .793, .02),
    iconPoint(.407, .808, -.25), iconPoint(.483, .808, -.43),
    iconPoint(.575, .780, -.48), iconPoint(.672, .738, -.46),
    iconPoint(.763, .728, -.37), iconPoint(.821, .729, -.20),
    iconPoint(.842, .730, .05), iconPoint(.827, .728, .32),
    iconPoint(.782, .727, .55), iconPoint(.700, .747, .65),
    iconPoint(.611, .779, .70), iconPoint(.522, .807, .70),
    iconPoint(.454, .830, .64), iconPoint(.414, .868, .548),
    iconPoint(.350, .907, .56),
  ], false, 'centripetal')
  const camera = studioCameraPose(0, aspect, compact).position
  const slope = Math.tan(MathUtils.degToRad(studioFov / 2))
  // Open the return under the collar so each length reads on its own.
  const sweep = (finale ? compact ? [
    [.28, .564, 2.02], [.236, .582, 2.15], [.287, .597, 2.23], [.426, .601, 2.32],
    [.590, .593, 2.44], [.733, .604, 2.58], [.810, .637, 2.67], [.784, .672, 2.75],
    [.652, .693, 2.84], [.489, .690, 2.70], [.347, .678, 2.58],
    [.223, .685, 2.44], [.139, .705, 2.40],
  ] : [
    [.497, .724, 2.02], [.473, .754, 2.15], [.514, .775, 2.24], [.601, .770, 2.38],
    [.697, .747, 2.53], [.792, .747, 2.61], [.860, .775, 2.74], [.875, .820, 2.88],
    [.820, .868, 2.97], [.714, .895, 2.89], [.596, .895, 2.72], [.476, .875, 2.58],
    [.371, .864, 2.45], [.287, .885, 2.36],
  ] : compact ? [
    [.28, .564, 2.02], [.20, .562, 2.25], [.148, .581, 2.43], [.142, .607, 2.57],
    [.205, .623, 2.68], [.35, .628, 2.83], [.53, .623, 2.91], [.73, .610, 2.72],
    [.90, .578, 2.28], [1.04, .578, 1.91],
  ] : [
    [.497, .724, 2.02], [.452, .727, 2.24], [.424, .754, 2.44], [.431, .797, 2.61],
    [.473, .833, 2.73], [.557, .849, 2.86], [.673, .847, 2.89], [.777, .827, 2.74],
    [.858, .789, 2.50], [.914, .749, 2.21],
  ]).map(([x, y, z]) => {
    const halfHeight = (camera.z - z) * slope
    return new Vector3(camera.x + (2 * x - 1) * aspect * halfHeight, camera.y + (1 - 2 * y) * halfHeight, z)
  })
  const exit = neck.getPoint(1)
  const tailPoints = [
    exit, exit.clone().addScaledVector(neck.getTangent(1), .22),
    ...sweep,
    ...(finale ? [] : [
      new Vector3(Math.max(5.9, sweep[sweep.length - 1].x + .9), compact ? -2.88 : -2.12, .66),
      new Vector3(8.25, -4.08, -1.72),
      new Vector3(9.08, -4.55, -3.55), new Vector3(13, -4.81, -3.66),
      new Vector3(18.2, -4.76, -3.69),
    ]),
  ]
  const tail = new CatmullRomCurve3(tailPoints, false, 'centripetal')
  tail.arcLengthDivisions = 480
  const positions = new Float32Array((scarfSegments + 1) * (scarfRows + 1) * 3)
  const across = new Vector3()
  const widthAxis = new Vector3()
  const previousTangent = new Vector3()
  const faceNormal = new Vector3()
  const rotation = new Quaternion()
  for (let x = 0; x <= scarfSegments; x++) {
    const collar = x <= collarColumns
    const t = collar ? x / collarColumns : (x - collarColumns) / (scarfSegments - collarColumns)
    const curve = collar ? neck : tail
    const u = curve.getUtoTmapping(t, t * curve.getLength())
    const center = curve.getPoint(u)
    const tangent = curve.getTangent(u).normalize()
    // Follow each turn with the previous width axis, easing it back toward vertical.
    across.set(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize()
    if (x === 0) widthAxis.copy(across)
    else {
      widthAxis.applyQuaternion(rotation.setFromUnitVectors(previousTangent, tangent))
      if (!collar && widthAxis.dot(across) < 0) across.negate()
      widthAxis.lerp(across, collar ? .22 : .12).normalize()
    }
    previousTangent.copy(tangent)
    across.copy(widthAxis)
    across.applyAxisAngle(tangent, collar ? .08 + .17 * Math.sin(t * 2 * Math.PI) - .41 * MathUtils.smoothstep(t, .89, 1) : -.33 + Math.sin(t * Math.PI) * .48)
    faceNormal.crossVectors(tangent, across).normalize()
    const sweepPoint = u * (tailPoints.length - 1) - 2
    const turnFit = finale && !collar
      ? 1 - .26 * Math.max(Math.max(0, 1 - Math.abs(sweepPoint - 1.15) / 1.5) ** 2,
        Math.max(0, 1 - Math.abs(sweepPoint - 6.1) / 1.8) ** 2,
        Math.max(0, 1 - Math.abs(sweepPoint - 11.9) / 2.1) ** 2)
      : 1
    const width = collar
      ? .22 + .29 * MathUtils.smoothstep(t, .02, .19) + .065 * MathUtils.smoothstep(t, .67, .79) - .055 * MathUtils.smoothstep(t, .92, 1)
      : turnFit * ((finale ? .49 : .52) + (finale ? .065 : compact ? .22 : .55) * MathUtils.smoothstep(sweepPoint, 2, 5.2)
        - (compact ? .35 : .68) * MathUtils.smoothstep(sweepPoint, sweep.length - 2, sweep.length + 2))
    for (let y = 0; y <= scarfRows; y++) {
      const v = y / scarfRows - .5
      const point = center.clone().addScaledVector(across, v * width)
      const crown = Math.cos(v * Math.PI) * (collar ? -.142 + .072 * MathUtils.smoothstep(t, .89, 1) : -.071)
      const fold = collar ? Math.sin(v * Math.PI * 2.5 + t * 8) * .018
        : Math.cos(v * Math.PI) * Math.cos(v * Math.PI * 3.8 + Math.sin(t * 14) * .54)
          * .15 * MathUtils.smoothstep(sweepPoint, .8, 4.5) * (1 - MathUtils.smoothstep(t, .7, .95))
      point.addScaledVector(faceNormal, crown + fold)
      point.toArray(positions, (y * (scarfSegments + 1) + x) * 3)
    }
  }
  return { positions, length: neck.getLength() + tail.getLength(), width: compact ? .74 : 1.07 }
}

function scarfFrame(aspect: number, compact: boolean) {
  const { position, target } = studioCameraPose(1, aspect, compact)
  const forward = target.sub(position).normalize()
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize()
  const up = new Vector3().crossVectors(right, forward).normalize()
  const slope = Math.tan(MathUtils.degToRad(studioFov / 2))
  return { position, forward, right, up, slope, aspect }
}

function glide(a: number, b: number, c: number, d: number, t: number, before = 1, span = 1, after = 1) {
  const incoming = (b - a) / before, middle = (c - b) / span, outgoing = (d - c) / after
  const enter = incoming * middle > 0 ? 2 * incoming * middle / (incoming + middle) : 0
  const leave = middle * outgoing > 0 ? 2 * middle * outgoing / (middle + outgoing) : 0
  return MathUtils.lerp(b, c, t * t * (3 - 2 * t)) + span * t * (1 - t) * ((1 - t) * enter - t * leave)
}

function shapeScarf(positions: Float32Array, frame: ReturnType<typeof scarfFrame>, points: number[][], width: number, roll: number, start: number, guide = false, taper = 0, turns = 0, flutter = 0, windPhase = 0, peel = 0, ground = 0) {
  const { position, forward, right, up, slope, aspect } = frame
  function world(target: Vector3, x: number, y: number, depth: number) {
    return target.copy(position).addScaledVector(forward, depth)
      .addScaledVector(right, (2 * x - 1) * depth * slope * aspect).addScaledVector(up, (1 - 2 * y) * depth * slope)
  }
  // Give the curve a smooth tangent in screen space while retaining depth for the folds.
  const depthScale = .065
  const flying = guide ? new CatmullRomCurve3(points.map(([x, y, depth]) => new Vector3(x * aspect, y, depth * depthScale))) : null
  const groundContact = (y: number) => ground * MathUtils.smoothstep(y, .74, .87)
  function guidePoint(t: number, target: Vector3) {
    if (flying) {
      flying.getPoint(t, target)
      const wave = t * 8.8 - windPhase
      const bend = flutter * (.40 + .60 * t) * Math.sin(wave)
      const x = target.x / aspect + .008 * bend, y = target.y + .052 * bend
      const depth = target.z / depthScale + .32 * flutter * Math.cos(wave)
      const contact = groundContact(y)
      const loft = .10 + (.33 - .22 * contact) * MathUtils.smoothstep(depth, 6.35, 9.2)
      const floorDepth = (studioDrapeFloor + loft - position.y) / Math.min(-.12, forward.y + (1 - 2 * y) * up.y * slope)
      return world(target, x, y, MathUtils.lerp(depth, floorDepth, contact))
    }
    const along = t * (points.length - 1)
    const index = Math.min(points.length - 2, Math.floor(along))
    const from = points[index], to = points[index + 1]
    const previous = points[index - 1] ?? from, following = points[index + 2] ?? to
    return world(target,
      glide(previous[0], from[0], to[0], following[0], along - index),
      glide(previous[1], from[1], to[1], following[1], along - index),
      glide(previous[2], from[2], to[2], following[2], along - index))
  }
  const path = guide ? null : new CatmullRomCurve3(Array.from({ length: 55 }, (_, i) => guidePoint(i / 54, new Vector3())))
  if (path) path.arcLengthDivisions = 420
  const across = new Vector3(), previousAcross = new Vector3(), normal = new Vector3(), point = new Vector3()
  const offset = new Vector3(), transported = new Vector3()
  const center = new Vector3(), tangent = new Vector3(), before = new Vector3(), floorAcross = new Vector3()
  const vertical = new Vector3(0, 1, 0)
  const maxRelief = guide ? MathUtils.lerp(.060, .112, MathUtils.smoothstep(aspect, .45, .9)) : .15
  const tangentWindow = MathUtils.lerp(.029, .016, MathUtils.smoothstep(aspect, .35, .44))
  const lipStart = .10, lipWidth = .5 - lipStart
  for (let column = start; column <= scarfSegments; column++) {
    const u = (column - start) / (scarfSegments - start)
    if (path) {
      path.getPointAt(u, center)
      path.getPointAt(Math.min(1, u + .036), tangent).sub(path.getPointAt(Math.max(0, u - .036), before)).normalize()
    } else {
      guidePoint(u, center)
      guidePoint(Math.min(1, u + tangentWindow), tangent).sub(guidePoint(Math.max(0, u - tangentWindow), before)).normalize()
    }
    const depth = offset.subVectors(center, position).dot(forward)
    across.crossVectors(tangent, guide ? forward : vertical)
    const facing = across.length()
    across.normalize()
    if (column > start && guide) {
      transported.copy(previousAcross).addScaledVector(tangent, -previousAcross.dot(tangent)).normalize()
      if (across.dot(transported) < 0) across.negate()
      across.lerp(transported, 1 - MathUtils.smoothstep(facing, .025, .32)).normalize()
    } else if (facing < .001) across.copy(up)
    if (column > start && across.dot(previousAcross) < 0) across.negate()
    previousAcross.copy(across)
    const bendFit = 1 - taper * MathUtils.smoothstep(u, .51, .69) * (1 - MathUtils.smoothstep(u, .82, .98))
    const twist = turns * (u - .5) * 2 * Math.PI
    const flip = .72 * flutter * (.38 + .62 * u) * Math.cos(u * 8.8 - windPhase + .68)
    across.applyAxisAngle(tangent, roll * bendFit * Math.sin(2 * Math.PI * u + .3) + twist + flip)
    const screenY = .5 - offset.dot(up) / (2 * depth * slope)
    const contact = groundContact(screenY)
    if (contact > 0) {
      floorAcross.set(-tangent.z, 0, tangent.x).normalize()
      const sameSide = floorAcross.dot(across)
      // Upright cloth has no stable floor direction until its length starts lying down.
      across.lerp(floorAcross.multiplyScalar(Math.sign(sameSide)), contact * .74 * Math.abs(sameSide) * (1 - tangent.y ** 2)).normalize()
    }
    normal.crossVectors(tangent, across)
    const sideFit = MathUtils.lerp(1, Math.min(1, aspect * .86), across.dot(right) ** 2)
    const breadth = Math.max(guide ? .16 : 0, 2 * depth * slope * width * sideFit * bendFit * (.83 + .17 * Math.sin(Math.PI * u)))
    const relief = MathUtils.lerp(.026, maxRelief, MathUtils.smoothstep(depth, 1.1, 7)) * bendFit
      * (1 + .25 * contact * Math.sin(u * 23 + 1.1))
    const creasePhase = u * 9 + .49 * contact * Math.sin(u * 15.5 + roll * 3)
    const crest = guide ? Math.sin(creasePhase) : -.42
    const lipTurn = peel && peel * MathUtils.lerp(.36, 1, MathUtils.smoothstep(u, .20, .85)) * (1 - .54 * contact)
    const lipRadius = lipTurn > .001 ? lipWidth * breadth / lipTurn : 0
    const flatten = MathUtils.smoothstep(contact, .42, .98)
    const heightScale = 1 - .61 * flatten
    const widthScale = MathUtils.lerp(1, 1 / Math.max(.43, Math.hypot(across.x, across.z)), flatten)
    let hemY = Infinity
    for (let row = 0; row <= scarfRows; row++) {
      const v = row / scarfRows - .5
      const pleat = Math.cos(v * Math.PI) * relief * (Math.sin(v * 12 + creasePhase) - crest)
      let spread = breadth * v
      let lift = pleat
      // Turn the upper edge back toward the camera without shortening the width of the wool.
      if (v > lipStart && lipRadius) {
        const angle = (v - lipStart) * lipTurn / lipWidth
        spread = breadth * lipStart + lipRadius * Math.sin(angle)
        lift += lipRadius * (1 - Math.cos(angle))
      }
      point.copy(center).addScaledVector(across, spread).addScaledVector(normal, lift)
      point.x += across.x * spread * (widthScale - 1)
      point.z += across.z * spread * (widthScale - 1)
      point.y = center.y + (point.y - center.y) * heightScale
      point.y = Math.max(-5.02, point.y)
      hemY = Math.min(hemY, point.y)
      point.toArray(positions, (row * (scarfSegments + 1) + column) * 3)
    }
    if (contact > 0) {
      // Let the lowest hem take the weight, keeping the raised side and the wrinkles intact.
      const height = studioDrapeFloor + .026 - hemY
      const shift = MathUtils.clamp(MathUtils.lerp(contact ** 2, 1, height > 0 ? ground * MathUtils.smoothstep(contact, 0, .12) : 0) * height, -.17, .17)
      // Follow the viewing ray so floor contact does not introduce a kink in the outline.
      offset.copy(center).sub(position).multiplyScalar(shift / Math.min(-.12, center.y - position.y))
      for (let row = 0; row <= scarfRows; row++) {
        const i = (row * (scarfSegments + 1) + column) * 3
        positions[i] += offset.x
        positions[i + 1] += offset.y
        positions[i + 2] += offset.z
      }
    }
  }
  return positions
}

export function makeStudioScarfLanding(opening: Float32Array, aspect: number, compact = aspect <= 1.5) {
  const frame = scarfFrame(aspect, compact)
  const { position, forward, right, up, slope } = frame
  let left = 1
  for (const x of [-appSize.width / 2 - .04, appSize.width / 2 + .04]) {
    for (const y of [-appSize.height / 2 - .04, appSize.height / 2 + .04]) {
      const point = studioApp.clone().add(new Vector3(x, y, .12)).sub(position)
      const halfHeight = point.dot(forward) * slope
      const u = .5 + point.dot(right) / (2 * halfHeight * aspect)
      left = Math.min(left, u)
    }
  }
  const sideRoom = MathUtils.smoothstep(aspect, .35, .65)
  const lapRoom = MathUtils.smoothstep(aspect, .35, .49)
  const leftFold = Math.max(.085, left - .052)
  const panelDepth = studioApp.clone().sub(position).dot(forward)
  const front = compact ? MathUtils.lerp(17.25, 15.6, sideRoom) : 14.4
  function grounded(x: number, depth: number, height = -4.94) {
    const y = position.y + forward.y * depth
    return [x, .5 - (height - y) / (2 * depth * slope * up.y), depth]
  }
  // The tucked end reaches the floor at the left edge. The loose lap returns through the inside of the loop.
  const points = [
    grounded(left + .047, panelDepth + 1.80, -3.8),
    grounded(left + .006, panelDepth + 1.54, -4.52),
    grounded(leftFold, panelDepth + .95),
    grounded(leftFold + .045, panelDepth - 1.28),
    ...(aspect < .65 ? [
      grounded(leftFold + .078, MathUtils.lerp(panelDepth, front, .31)),
      grounded(leftFold + .177, MathUtils.lerp(panelDepth, front, .56), -4.86),
    ] : []),
    grounded(Math.max(leftFold + .13, .275), front + 1.7),
    grounded(.51, front - .16),
    grounded(.73, front + .56, -4.88),
    grounded(.79, front + 2.05),
    grounded(MathUtils.lerp(.65, .69, lapRoom), front + MathUtils.lerp(3.30, 3.66, lapRoom)),
    grounded(MathUtils.lerp(.48, .57, lapRoom), front + MathUtils.lerp(2.86, 3.30, lapRoom), -4.72),
    grounded(MathUtils.lerp(.53, .63, lapRoom), front + 1.67, -4.74),
    grounded(.81, front + .67, -4.48),
    grounded(.92, front + 1.15, -4.80),
    grounded(1.13, front + 1.7),
  ]
  return shapeScarf(opening.slice(), frame, points, MathUtils.lerp(.087, .126, sideRoom), -.34, collarColumns + 1, false, .10, 0, 0, 0, 1.45)
}

export function stageStudioScarf(rest: Float32Array, opening: Float32Array, landing: Float32Array, progress: number) {
  if (progress <= .14 || progress >= .82) {
    rest.set(progress <= .14 ? opening : landing)
    return
  }
  const fall = MathUtils.smoothstep(progress, .15, .74)
  const tuck = MathUtils.smoothstep(progress, .145, .31)
  const edgeClearance = MathUtils.smoothstep(progress, .14, .25) * (1 - MathUtils.smoothstep(progress, .61, .81))
  for (let x = collarColumns + 1; x <= scarfSegments; x++) {
    const u = (x - collarColumns) / (scarfSegments - collarColumns)
    const travel = MathUtils.smootherstep(progress, .14 + u * .06, .76 + u * .06)
    const underPanel = MathUtils.smoothstep(u, .39, .57)
    const descent = MathUtils.lerp(fall, tuck, underPanel)
    const wave = MathUtils.smootherstep(progress, .14 + u * .17, .62 + u * .15)
    const lift = Math.sin(Math.PI * wave) ** 2 * (1 - underPanel) * (1 - u) * .71
    for (let y = 0; y <= scarfRows; y++) {
      const i = (y * (scarfSegments + 1) + x) * 3
      rest[i] = MathUtils.lerp(opening[i], landing[i], travel)
      rest[i + 2] = MathUtils.lerp(opening[i + 2], landing[i + 2], travel)
      const underEdge = MathUtils.smoothstep(rest[i], studioApp.x - appSize.width / 2 - .85, studioApp.x - appSize.width / 2 - .18)
        * (1 - MathUtils.smoothstep(rest[i + 2], studioApp.z + .38, studioApp.z + 1.45)) * edgeClearance
      const height = MathUtils.lerp(opening[i + 1], landing[i + 1], descent) + lift
      rest[i + 1] = Math.max(-5.02, MathUtils.lerp(height, Math.min(height, -4.72), underEdge))
    }
  }
  // Keep the loosening laps attached to the moving fold while they slide out of the frame.
  const release = MathUtils.smootherstep(progress, .14, .33)
  const turn = -.76 * release
  const cos = Math.cos(turn), sin = Math.sin(turn)
  for (let y = 0; y <= scarfRows; y++) {
    const row = y * (scarfSegments + 1)
    const join = (row + collarColumns + 1) * 3
    for (let x = 0; x <= collarColumns; x++) {
      const i = (row + x) * 3
      const dx = (opening[i] - opening[join]) * (1 + .36 * release)
      const dz = (opening[i + 2] - opening[join + 2]) * (1 - .38 * release)
      rest[i] = rest[join] + cos * dx + sin * dz
      rest[i + 1] = rest[join + 1] + opening[i + 1] - opening[join + 1] - .38 * release * (1 - x / collarColumns)
      rest[i + 2] = rest[join + 2] + cos * dz - sin * dx
    }
  }
}

type ScarfShape = {
  points: number[][]
  width: number
  roll: number
  taper?: number
  turns?: number
  peel?: number
}

type ScarfCue = ScarfShape & { at: number; hold?: number; ground?: number; compact?: ScarfShape; tablet?: ScarfShape }

const featureEntry: ScarfCue[] = [
  // x and y are fractions of the frame. The third coordinate is camera-space depth.
  { at: .27, hold: .35, roll: .11, width: 1.67, points: [[-.77, .516, 1.31], [-.47, .494, 1.30], [-.15, .490, 1.25], [.16, .504, 1.23], [.48, .520, 1.26], [.80, .501, 1.24], [1.12, .484, 1.26], [1.44, .486, 1.29], [1.77, .509, 1.32]] },
  // The fringe pulls first. The broad face banks before the rolled edge falls away.
  { at: .395, roll: .35, width: 1.19, turns: -.09, peel: 1.38, points: [[-.70, .52, 1.60], [-.40, .514, 1.68], [-.095, .535, 1.75], [.22, .573, 1.82], [.52, .612, 1.92], [.81, .643, 2.12], [1.09, .655, 2.30], [1.37, .657, 2.55], [1.64, .660, 2.78]] },
  { at: .454, roll: .48, width: .58, turns: -.16, peel: 1.74, points: [[-.50, .56, 3.45], [-.27, .58, 3.57], [-.018, .62, 3.68], [.24, .677, 3.78], [.47, .754, 3.93], [.67, .820, 4.24], [.86, .851, 4.56], [1.08, .857, 4.82], [1.32, .838, 5.00]] },
  { at: .507, roll: .19, width: .252, taper: .27, peel: .53, points: [[-.31, .49, 7.04], [-.17, .57, 6.83], [-.018, .666, 6.56], [.167, .754, 6.32], [.36, .842, 6.18], [.55, .890, 6.20], [.73, .890, 6.37], [.90, .841, 6.52], [1.066, .769, 6.64]] },
]

type FeatureDrape = ScarfShape & { compact: ScarfShape; tablet?: ScarfShape }

const closingDrape: FeatureDrape = {
  // Rest in a loose foreground curve below the card, leaving the frame open.
  roll: -.23, width: .140, taper: .16, peel: 1.3,
  points: [[1.2, .804, 9.8], [1.0688, .840, 9.4], [.9376, .882, 8.8], [.7982, .912, 8.1], [.6588, .924, 7.6], [.5358, .912, 7.45], [.4456, .888, 7.6], [.380, .870, 7.9], [.3226, .876, 8.2]],
  compact: { width: .112, roll: -.12, taper: .13, peel: 1.1, points: [[1.2164, .834, 9.8], [1.0852, .864, 9.35], [.9458, .900, 8.8], [.8064, .924, 8.25], [.6588, .930, 7.8], [.5276, .924, 7.55], [.4292, .906, 7.65], [.3554, .888, 7.9], [.2898, .894, 8.2]] },
}

// Keep the Token and Service Directory sweeps as the two reference paths.
const diagonalSweep: ScarfShape = { roll: .43, width: .24, taper: .59, points: [[-.186, .048, 8.9], [.025, .156, 8.2], [.211, .286, 7.2], [.405, .414, 6.1], [.574, .525, 6.2], [.72, .644, 7.1], [.814, .772, 7.8], [.867, .872, 7.3], [.920, .942, 6.5]] }
const lateralSweep: ScarfShape = { roll: .57, width: .248, taper: .37, points: [[-.373, .340, 8.6], [-.113, .369, 7.7], [.146, .400, 6.5], [.405, .440, 5.1], [.649, .480, 4.6], [.865, .556, 5.5], [.937, .678, 6.7], [.954, .786, 6.9], [.920, .901, 6.6]] }

function placeSweep(shape: ScarfShape, x: number, y: number): ScarfShape {
  return {
    ...shape,
    points: shape.points.map(([u, v, depth]) => [u + x, v + y, depth]),
  }
}

function bankedSweep(shape: ScarfShape, sideways: number, rise: number, crest: number, drape = 0): ScarfCue[] {
  const compact = (wide: ScarfShape): ScarfShape => ({
    ...wide, width: wide.width * .94, roll: wide.roll * .5,
    points: wide.points.map(([x, y, depth]) => [x, y, depth * .75 + 1.8]),
  })
  const exit = {
    ...shape, roll: -shape.roll * .85, width: .219,
    points: shape.points.map(([x, y, depth], i) => {
      const u = i / (shape.points.length - 1)
      const sag = Math.sin(Math.PI * u) ** 2
      return [x + sideways * (1 - .62 * u), y + rise * (rise < 0 ? .76 + .24 * u : 1) + drape * sag,
        depth + .15 * Math.sin(Math.PI * u) - drape * 3 * sag]
    }),
  }
  return [{ ...shape, at: .29, compact: compact(shape) }, { ...exit, at: crest, compact: compact(exit) }]
}

const featurePasses: (ScarfShape | ScarfCue[])[] = [
  [
    // Lift the left edge first, then open the hem before it tucks behind the quota card.
    { at: .22, roll: .29, width: .234, taper: .38, peel: 1.5, points: [[-.20, .42, 9.1], [-.012, .39, 8.3], [.190, .377, 7.5], [.40, .429, 6.4], [.585, .493, 5.6], [.741, .522, 5.5], [.864, .587, 6.0], [.949, .689, 6.5], [1.033, .805, 6.9]] },
    { at: .365, roll: .52, width: .258, taper: .38, peel: 1.96, points: [[-.106, .262, 8.9], [.109, .286, 8.0], [.312, .323, 6.8], [.484, .383, 5.6], [.627, .429, 5.1], [.763, .430, 5.4], [.874, .452, 6.0], [.955, .522, 6.6], [1.014, .635, 7.0]] },
  ],
  bankedSweep({ roll: -.35, width: .25, taper: .32, points: [[1.03, .06, 9.3], [.86, .17, 8.6], [.68, .26, 7.3], [.49, .32, 6.2], [.31, .39, 5.4], [.17, .49, 5.7], [.10, .62, 6.4], [.10, .77, 6.9], [.17, .88, 7.1]] }, .13, .08, .42, .13),
  diagonalSweep,
  // Wind the length of the scarf across the middle, then let the plain end rise out of the frame.
  [
    { at: .16, roll: -.24, width: .235, taper: .28, points: [[.55, -.07, 9.2], [.51, .073, 8.8], [.49, .229, 8.1], [.50, .373, 7.4], [.55, .499, 6.8], [.63, .613, 6.55], [.723, .737, 6.55], [.782, .874, 6.7], [.81, 1.013, 6.9]] },
    { ...placeSweep(lateralSweep, -.045, -.05), at: .30 },
    { at: .415, roll: .28, width: .239, taper: .42, turns: 1.10, points: [[.042, .178, 9.1], [.155, .267, 8.3], [.262, .392, 7.1], [.386, .471, 6.0], [.551, .472, 5.1], [.723, .425, 5.3], [.813, .491, 5.9], [.907, .625, 6.7], [.966, .777, 7.0]] },
  ],
  [
    { at: .17, roll: .23, width: .23, taper: .30, points: [[.38, -.10, 9.3], [.42, .056, 8.7], [.48, .199, 8], [.548, .343, 7.35], [.585, .486, 6.9], [.58, .638, 6.6], [.529, .78, 6.6], [.46, .907, 6.75], [.39, 1.036, 6.9]] },
    { at: .30, roll: -.57, width: .248, taper: .37, points: [[.946, .335, 8.6], [.852, .368, 7.7], [.726, .411, 6.5], [.555, .468, 5.1], [.311, .508, 4.6], [.135, .584, 5.5], [.064, .706, 6.7], [.032, .814, 6.9], [.048, .929, 6.6]] },
    { at: .42, roll: -.42, width: .240, taper: .44, points: [[.976, .54, 8.9], [.901, .406, 8.2], [.810, .290, 7.3], [.654, .225, 6.1], [.460, .259, 5.4], [.289, .354, 5.5], [.158, .435, 6.0], [.058, .451, 6.5], [-.102, .363, 6.9]] },
  ],
  [
    { at: .16, roll: .21, width: .23, taper: .25, points: [[.65, .13, 9.45], [.61, .236, 9], [.574, .330, 8.4], [.55, .431, 7.65], [.551, .534, 7.0], [.584, .667, 6.75], [.638, .795, 6.65], [.704, .926, 6.65], [.77, 1.04, 6.65]] },
    { ...lateralSweep, at: STUDIO_HANDOFF.crest },
  ],
  [
    // Pause the lifted arch before it rolls down from above the preview.
    { at: .23, hold: .29, roll: -.36, width: .238, taper: .36, points: [[.038, .619, 9.5], [.150, .478, 8.7], [.286, .350, 7.5], [.427, .300, 6.6], [.571, .339, 6.0], [.711, .452, 6.2], [.821, .586, 6.6], [.891, .714, 6.8], [.949, .840, 6.7]] },
    { at: .44, roll: .23, width: .249, taper: .33, points: [[.144, -.044, 9.1], [.231, .053, 8.2], [.339, .143, 7.1], [.467, .226, 5.9], [.597, .262, 5.4], [.727, .301, 5.7], [.832, .384, 6.3], [.914, .503, 6.8], [.961, .627, 6.8]] },
  ],
  [
    // Turn the broad face over progressively as it banks toward the account heading.
    { at: .22, roll: -.40, width: .239, taper: .30, points: [[1.083, .274, 9.3], [.930, .367, 8.3], [.791, .442, 7.4], [.650, .488, 6.3], [.512, .504, 5.8], [.364, .489, 6.1], [.209, .534, 6.7], [.102, .638, 6.9], [.059, .775, 6.7]] },
    { at: .41, roll: .40, width: .251, taper: .34, turns: -.72, points: [[.951, .199, 9.2], [.808, .279, 8.4], [.669, .382, 7.3], [.536, .468, 6.1], [.406, .516, 5.4], [.268, .521, 5.9], [.159, .548, 6.5], [.122, .645, 6.8], [.161, .781, 6.9]] },
  ],
  [
    // Lift out of the low fold, then linger in a suspended hook before draping down.
    { at: .23, roll: -.31, width: .242, taper: .37, points: [[.806, .130, 9.5], [.786, .237, 8.7], [.715, .333, 7.7], [.615, .425, 6.6], [.481, .488, 5.4], [.344, .557, 5.4], [.238, .646, 6.0], [.177, .760, 6.4], [.188, .889, 6.7]] },
    {
      at: .39, hold: .44, roll: .16, width: .255, taper: .38, peel: .68,
      points: [[.947, .106, 9.05], [.811, .163, 8.4], [.651, .244, 7.2], [.488, .350, 6.0], [.360, .477, 5.2], [.286, .618, 5.2], [.294, .740, 5.9], [.392, .802, 6.5], [.531, .783, 6.8]],
      compact: { roll: .10, width: .235, taper: .28, peel: .5, points: [[.947, .106, 9.05], [.751, .163, 8.4], [.551, .244, 7.2], [.310, .330, 6.0], [.140, .480, 5.2], [.160, .650, 5.2], [.280, .780, 5.9], [.440, .802, 6.5], [.551, .713, 6.8]] },
    },
  ],
  [
    { at: .20, roll: .18, width: .186, taper: .36, points: [[.768, .083, 9.55], [.736, .191, 9.2], [.694, .304, 8.75], [.651, .427, 8.3], [.612, .557, 7.85], [.586, .684, 7.4], [.573, .794, 7.2], [.574, .887, 6.85], [.594, .967, 6.7]] },
    { at: STUDIO_HANDOFF.crest, roll: .43, width: .229, taper: .43, points: [[.458, -.055, 8.9], [.408, .102, 8.2], [.370, .277, 7.2], [.382, .448, 6.1], [.470, .576, 6.2], [.611, .656, 7.1], [.725, .747, 7.8], [.825, .854, 7.3], [.921, .944, 6.5]] },
  ],
  [
    {
      // Open the return fold before pulling the whole length into the share card sweep.
      at: .145, roll: -.10, width: .169, taper: .34, peel: .65,
      points: [[.298, .239, 9.51], [.249, .375, 9.25], [.200, .521, 8.81], [.174, .635, 8.23], [.198, .729, 7.61], [.279, .805, 7.05], [.440, .863, 6.75], [.655, .883, 6.59], [.893, .850, 6.48]],
      tablet: { roll: .12, width: .164, taper: .34, peel: .75, points: [[.005, .270, 9.51], [.068, .408, 9.25], [.157, .555, 8.81], [.274, .694, 8.23], [.418, .780, 7.61], [.539, .786, 7.05], [.649, .790, 6.75], [.773, .832, 6.59], [.907, .878, 6.48]] },
    },
    { at: .31, hold: .37, roll: .26, width: .24, taper: .40, points: [[.049, -.102, 9.06], [.104, .055, 8.28], [.204, .209, 7.36], [.321, .368, 6.34], [.481, .468, 5.64], [.660, .474, 6.14], [.779, .430, 6.92], [.852, .468, 7.3], [.878, .621, 7.3]] },
    { at: .49, roll: .12, width: .215, taper: .27, points: [[.799, .064, 9.25], [.765, .195, 8.8], [.726, .327, 8.25], [.676, .461, 7.75], [.613, .594, 7.25], [.535, .701, 7.1], [.437, .792, 7.3], [.357, .878, 7.25], [.304, .951, 6.8]] },
  ],
]

function hangingCloth(roll: number, points: number[][], compact = points): FeatureDrape {
  return {
    roll, width: .162, points,
    compact: { roll: roll * .55, width: .157, taper: .24, points: compact },
  }
}

export const studioQuotaCardDepth = 10.6

const featureDrapes: FeatureDrape[] = [
  // The high edge drops along the left gutter before spreading across the floor.
  hangingCloth(-.36, [[-.235, .20, 10.4], [-.123, .33, 9.95], [-.043, .515, 9.3], [.027, .688, 8.75], [.190, .803, 8.10], [.388, .898, 7.6], [.578, .933, 7.1], [.768, .907, 6.8], [.922, .863, 6.55]],
    [[-.23, .238, 10.35], [-.142, .360, 9.96], [-.085, .552, 9.55], [-.028, .717, 8.91], [.121, .836, 8.35], [.321, .918, 7.93], [.531, .947, 7.40], [.720, .921, 7], [.854, .846, 6.59]]),
  // Tuck one end behind the card and let the exposed length fall diagonally from its corner.
  {
    roll: .43, width: .162,
    points: [[.66, .242, 14.4], [.852, .330, 13.7], [.958, .477, 12.7], [.965, .670, 12.55], [.895, .778, 9.1], [.777, .845, 7.95], [.648, .890, 7.35], [.533, .938, 6.9], [.425, 1.135, 6.55]],
    compact: { roll: .24, width: .135, taper: .24, points: [[.675, .344, 14.2], [.856, .424, 13.5], [.951, .545, 12.5], [.962, .687, 11.85], [.899, .818, 9.3], [.791, .886, 8], [.641, .924, 7.35], [.502, .981, 6.9], [.387, 1.135, 6.55]] },
  },
  // The short end curls upward underneath the right corner of the balance card.
  {
    roll: -.68, width: .145, taper: .14, peel: 1.74,
    points: [[-.132, .699, 9.65], [.017, .739, 9.2], [.151, .818, 8.65], [.285, .893, 8.1], [.418, .932, 7.56], [.548, .925, 7.2], [.657, .888, 6.9], [.733, .826, 7.11], [.773, .768, 7.65]],
    compact: { roll: -.42, width: .132, taper: .10, peel: 1.56, points: [[-.135, .739, 9.65], [.025, .788, 9.2], [.168, .853, 8.72], [.322, .910, 8.18], [.474, .931, 7.67], [.608, .916, 7.28], [.723, .893, 7.0], [.811, .868, 7.19], [.870, .841, 7.48]] },
  },
  {
    width: .162, roll: .28, peel: 1.65,
    points: [[1.176, .695, 9.7], [1.018, .795, 9.3], [.853, .884, 8.75], [.695, .923, 8.25], [.523, .882, 8.0], [.357, .827, 8.15], [.229, .848, 7.8], [.147, .916, 7.20], [.060, .933, 6.9]],
    compact: { width: .125, roll: .13, peel: 1.1, points: [[1.18, .747, 9.7], [1.04, .825, 9.3], [.872, .883, 8.85], [.704, .915, 8.35], [.538, .887, 8.15], [.378, .860, 8.2], [.243, .866, 7.75], [.151, .908, 7.25], [.060, .932, 6.95]] },
  },
  // Let the conversation drape slip past the lower left corner and hang on the bias.
  hangingCloth(-.32, [[-.133, .14, 9.7], [-.035, .276, 9.2], [-.034, .454, 8.7], [.007, .659, 8.15], [.179, .758, 7.75], [.404, .817, 7.35], [.546, .902, 7.0], [.665, .925, 6.75], [.775, .886, 6.55]],
    [[-.136, .205, 9.55], [-.076, .386, 9.18], [-.058, .550, 8.81], [.008, .729, 8.44], [.129, .825, 8.07], [.302, .865, 7.7], [.481, .897, 7.33], [.648, .924, 6.96], [.802, .936, 6.59]]),
  {
    // Keep the fall outside the timing preview, with only the loose end resting below it.
    roll: .44, width: .152, taper: .17, peel: 1.9,
    points: [[1.195, .26, 10.12], [1.065, .358, 9.73], [1.013, .512, 9.20], [1.003, .676, 8.70], [.895, .808, 8.22], [.718, .878, 7.74], [.514, .870, 7.36], [.311, .901, 6.98], [.122, .926, 6.55]],
    compact: { roll: .23, width: .136, taper: .16, peel: 1.75, points: [[1.208, .278, 10.14], [1.094, .386, 9.72], [1.027, .540, 9.24], [1.011, .684, 8.81], [.923, .798, 8.28], [.760, .885, 7.82], [.532, .906, 7.41], [.308, .903, 7.00], [.108, .917, 6.55]] },
  },
  hangingCloth(-.39, [[-.19, .732, 9.7], [-.065, .818, 9.2], [.079, .903, 8.65], [.246, .928, 8.2], [.428, .884, 7.8], [.583, .855, 7.7], [.703, .870, 7.5], [.799, .923, 7.1], [.919, .927, 6.7]]),
  {
    // Let the upper end fall outside the card, gathering the free hem at the left front corner.
    roll: -.34, width: .154, taper: .18, peel: 2.25,
    points: [[1.150, -.16, 11.3], [1.095, .129, 10.9], [1.060, .423, 10.3], [1.035, .671, 9.5], [.908, .844, 8.6], [.648, .935, 7.9], [.356, .913, 7.55], [.173, .869, 7.3], [.053, .910, 6.8]],
    compact: { roll: -.17, width: .121, taper: .17, peel: 1.55, points: [[1.170, -.16, 11.4], [1.115, .143, 10.9], [1.075, .452, 10.2], [1.003, .738, 9.3], [.835, .880, 8.5], [.620, .933, 8.0], [.399, .930, 7.6], [.207, .911, 7.25], [.057, .906, 6.9]] },
  },
  {
    // The rear length comes from outside the frame, then the hem folds over the first phrase.
    roll: -.39, width: .127, taper: .16, peel: 1.30,
    points: [[-.168, .145, 11.0], [-.037, .158, 10.5], [.083, .179, 10.0], [.183, .225, 9.5], [.243, .338, 8.75], [.349, .478, 8.05], [.374, .665, 7.65], [.472, .875, 7.36], [.728, .876, 7.07]],
    compact: { roll: -.33, width: .128, taper: .12, peel: 1.28, points: [[-.170, .014, 10.55], [-.096, .043, 10.18], [-.023, .085, 9.65], [.029, .145, 9.12], [.039, .227, 8.68], [.024, .390, 8.20], [.032, .590, 7.72], [.199, .824, 7.15], [.709, .895, 6.63]] },
  },
  {
    // Settle in a shallow foreground wave instead of tracing the viewport edge.
    roll: .24, width: .133, taper: .16, peel: 1.1,
    points: [[-.20, .822, 9.8], [-.0811, .858, 9.4], [.0378, .894, 8.8], [.1608, .918, 8.1], [.2838, .924, 7.6], [.4068, .912, 7.45], [.5216, .888, 7.6], [.620, .882, 7.9], [.702, .900, 8.2]],
    compact: { roll: .12, width: .113, taper: .13, peel: .85, points: [[-.2082, .840, 9.8], [-.0852, .876, 9.35], [.046, .906, 8.8], [.1772, .924, 8.25], [.3084, .930, 7.8], [.4396, .924, 7.55], [.5544, .906, 7.65], [.6446, .900, 7.9], [.7184, .918, 8.2]] },
  },
  {
    // Let the wool fall into a low, loose fold under Settings.
    roll: -.20, width: .14, taper: .29, peel: .74,
    points: [[.018, .852, 9.32], [.145, .841, 9.10], [.249, .870, 8.68], [.333, .939, 7.90], [.479, .953, 7.50], [.605, .895, 8.20], [.711, .843, 8.55], [.846, .879, 7.60], [1.13, .917, 6.75]],
    compact: { roll: -.15, width: .115, taper: .37, peel: .78, points: [[.634, .878, 9.76], [.518, .854, 9.68], [.369, .852, 9.46], [.242, .866, 8.92], [.188, .898, 8.09], [.244, .940, 7.30], [.397, .947, 6.87], [.707, .894, 6.58], [1.14, .923, 6.27]] },
    tablet: { roll: .28, width: .138, taper: .22, peel: 2.30, points: [[-.080, .765, 9.7], [.071, .835, 9.23], [.213, .885, 8.65], [.351, .904, 8.05], [.484, .883, 7.6], [.614, .854, 7.1], [.730, .851, 6.8], [.820, .877, 6.65], [.908, .931, 6.9]] },
  },
  closingDrape,
]
const featureKeys = Array.from({ length: studioFinaleStart }, (_, screen): ScarfCue[] => {
  const drape = featureDrapes[screen]
  const nextLead = screen === studioFinaleStart - 1 ? 0 : STUDIO_HANDOFF.lead
  const settle = { ...drape, at: screen + (screen ? STUDIO_HANDOFF.rest : .55), hold: screen + 1 + nextLead, ground: 1 }
  if (screen === 0) return [settle]
  const pass = featurePasses[screen - 1]
  const beats = Array.isArray(pass) ? pass : [{ ...pass, at: STUDIO_HANDOFF.crest }]
  return [...beats.map(beat => ({ ...beat, at: screen + beat.at, hold: beat.hold === undefined ? undefined : screen + beat.hold })), settle]
})

export function makeStudioScarfChapters(landing: Float32Array, aspect: number, compact: boolean) {
  const frame = scarfFrame(aspect, compact)
  const start = studioCollarTrim(1)
  const keys = [...featureEntry, ...featureKeys.flat()].flatMap(({ at, hold, roll, width, points, taper = 0, turns = 0, peel = 0, ground = 0, compact: phone, tablet }) => {
    const narrow = aspect > .57 ? tablet ?? phone : phone
    if (compact && narrow) {
      width = narrow.width
      roll = narrow.roll
      taper = narrow.taper ?? 0
      turns = narrow.turns ?? turns
      peel = narrow.peel ?? peel
      points = narrow.points
    }
    const positions = shapeScarf(landing.slice(), frame, points, width, roll, start, true, taper, turns, 0, 0, peel, ground)
    const shape = { roll, width, points, positions, taper, turns, peel, ground }
    return hold === undefined ? [{ at, ...shape }] : [{ at, ...shape }, { at: hold, ...shape }]
  })
  const finish = makeStudioScarfPose(aspect, compact, true).positions
  const finaleTransform = studioFinaleTransform(aspect, compact)
  const vertex = new Vector3()
  for (let i = 0; i < finish.length; i += 3) {
    vertex.fromArray(finish, i).applyMatrix4(finaleTransform).toArray(finish, i)
  }
  return { frame, keys, landing, finish }
}

function approachStudioWool(rest: Float32Array, landing: Float32Array, wool: Float32Array, travel: number, guideFrame?: ReturnType<typeof scarfFrame>) {
  const start = studioCollarTrim(1)
  const columns = scarfSegments + 1
  for (let row = 0; row <= scarfRows; row++) {
    const offset = row * columns * 3
    rest.set(landing.subarray(offset, offset + start * 3), offset)
  }
  const fromAcross = new Vector3(), toAcross = new Vector3(), edge = new Vector3()
  const fromCenter = new Vector3(), toCenter = new Vector3(), center = new Vector3()
  const fromPoint = new Vector3(), toPoint = new Vector3()
  const turn = new Quaternion(), previousTurn = new Quaternion(), partialTurn = new Quaternion(), inverseTurn = new Quaternion()
  const slideRelease = 1 - MathUtils.smoothstep(travel, .23, .75)
  const tailLead = MathUtils.smoothstep(travel, .61, .77) * (1 - MathUtils.smoothstep(travel, .79, .92))
  for (let column = start; column <= scarfSegments; column++) {
    const along = (column - start) / (scarfSegments - start)
    const slip = guideFrame ? 0 : .055 * (1 - MathUtils.smoothstep(along, 0, .11)) * Math.sin(Math.PI * travel) ** 2
    const delay = guideFrame ? (1 - along) * .068 : along * .19
    let t = MathUtils.smoothstep(travel + slip, delay, .81 + delay)
    if (guideFrame) {
      // Spread the narrow camera's longer approach over the full scroll distance.
      const phase = MathUtils.clamp((travel - delay) / .932, 0, 1)
      const end = Math.min(phase, 1 - phase)
      const ramp = .050
      const lead = (end < ramp ? end * end / (2 * ramp) : end - ramp / 2) / (1 - ramp)
      const paced = phase < .5 ? lead : 1 - lead
      t = MathUtils.lerp(paced, MathUtils.smoothstep(phase, 0, 1), MathUtils.smoothstep(guideFrame.aspect, .4, .7))
    }
    const i = column * 3, j = (scarfRows * columns + column) * 3
    fromAcross.fromArray(landing, j).sub(edge.fromArray(landing, i)).normalize()
    toAcross.fromArray(wool, j).sub(edge.fromArray(wool, i)).normalize()
    turn.setFromUnitVectors(fromAcross, toAcross)
    // Keep adjacent folds turning the same way as their width axes pass through a half turn.
    if (column > start && turn.dot(previousTurn) < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w)
    previousTurn.copy(turn)
    inverseTurn.copy(turn).invert()
    const halfAngle = Math.acos(MathUtils.clamp(turn.w, -1, 1))
    const sin = Math.sin(halfAngle)
    const portion = sin > 1e-6 ? Math.sin(halfAngle * t) / sin : t
    partialTurn.set(turn.x * portion, turn.y * portion, turn.z * portion, Math.cos(halfAngle * t)).normalize()
    const mid = (Math.floor(scarfRows / 2) * columns + column) * 3
    fromCenter.fromArray(landing, mid)
    toCenter.fromArray(wool, mid)
    center.copy(fromCenter).lerp(toCenter, t)
    if (guideFrame) {
      // Slip the tucked end below the App before lifting it into the close-up.
      const sideDelay = .02 * MathUtils.smoothstep(along, 0, .16)
      const slideOut = MathUtils.smoothstep(travel, sideDelay, .12 + sideDelay) * slideRelease
      const tuck = 1 - MathUtils.smoothstep(along, .12, .26)
      const { position, forward, right, up, aspect, slope } = guideFrame
      edge.subVectors(fromCenter, position)
      const fromX = edge.dot(right) / edge.dot(forward)
      edge.subVectors(toCenter, position)
      const toX = edge.dot(right) / edge.dot(forward)
      edge.subVectors(center, position)
      const trackX = edge.dot(forward) * MathUtils.lerp(fromX, toX, t) - edge.dot(right)
      center.addScaledVector(right, trackX * MathUtils.lerp(.52, 1, MathUtils.smoothstep(aspect, .4, .8)))
      center.y -= 2.65 * slideOut * tuck
      center.x += .16 * tailLead * MathUtils.smoothstep(along, .82, .92) * MathUtils.smoothstep(aspect, .46, .75) - .75 * slideOut * tuck
      edge.subVectors(center, position)
      const cameraDepth = edge.dot(forward) * slope
      const edgeClearance = -.89 * aspect * cameraDepth - edge.dot(right)
      const edgeHold = MathUtils.smoothstep(travel, .04, .14) * (1 - MathUtils.smoothstep(travel, .40 + along * .72, .56 + along * .72))
      center.addScaledVector(right, Math.max(0, edgeClearance) * edgeHold * (1 - MathUtils.smoothstep(along, .18, .36)))
      center.addScaledVector(up, Math.max(0, -.90 * cameraDepth - edge.dot(up)) * MathUtils.smoothstep(travel, .04, .23))
      const innerLap = MathUtils.smoothstep(along, .64, .81) * (1 - MathUtils.smoothstep(along, .87, .98))
      const unwind = MathUtils.smoothstep(travel, .48, .64) * (1 - MathUtils.smoothstep(travel, .91, 1))
      center.addScaledVector(right, -.36 * cameraDepth * aspect * innerLap * unwind * (1 - MathUtils.smoothstep(aspect, .47, .65)))
    }
    for (let row = 0; row <= scarfRows; row++) {
      const index = (row * columns + column) * 3
      fromPoint.fromArray(landing, index).sub(fromCenter)
      toPoint.fromArray(wool, index).sub(toCenter).applyQuaternion(inverseTurn)
      fromPoint.lerp(toPoint, t).applyQuaternion(partialTurn).add(center)
      fromPoint.y = Math.max(-5.02, fromPoint.y)
      fromPoint.toArray(rest, index)
    }
  }
}

export function stageStudioScarfChapters(rest: Float32Array, chapters: ReturnType<typeof makeStudioScarfChapters>, progress: number) {
  const { keys, frame, landing, finish } = chapters
  if (progress <= 0) { rest.set(landing); return }
  if (progress > studioFinaleStart) {
    const travel = MathUtils.clamp((progress - studioFinaleStart) / (studioFinaleEnd - studioFinaleStart - .09), 0, 1)
    if (travel === 1) { rest.set(finish); return }
    approachStudioWool(rest, keys[keys.length - 1].positions, finish, travel)
    // The turn travels from the free end toward the tucked edge as it coils around the neck.
    const first = studioCollarTrim(1)
    const wrap = studioFinaleWrap(progress)
    const join = new Vector3(), point = new Vector3()
    for (let row = 0; row <= scarfRows; row++) {
      const offset = row * (scarfSegments + 1) * 3
      join.fromArray(rest, offset + first * 3)
      for (let column = 0; column < first; column++) {
        const index = offset + column * 3
        const turn = 1 - column / first
        const coil = MathUtils.smoothstep(wrap, .26 * turn, .74 + .26 * turn)
        point.fromArray(finish, index).lerp(join, 1 - coil).toArray(rest, index)
      }
    }
    return
  }
  if (progress < keys[0].at) {
    approachStudioWool(rest, landing, keys[0].positions, progress / keys[0].at, frame)
    return
  }
  const screen = Math.floor(progress)
  const phase = screen > 0 ? studioHandoffPhase(progress - screen) : progress
  progress = screen + phase
  // A scroll-driven gust bends the centerline and rolls the fabric as it reaches the fringe.
  const flutter = screen > 0
    ? MathUtils.smoothstep(phase, .05, .20) * (1 - MathUtils.smoothstep(phase, .44, STUDIO_HANDOFF.rest))
      * (screen === 3 || screen === 6 ? .34 : frame.aspect <= 1.5 ? .69 : 1)
    : 0
  const index = keys.findIndex(({ at }) => progress <= at)
  if (index <= 0 || !flutter && progress === keys[index].at) {
    rest.set(keys[index < 0 ? keys.length - 1 : index].positions)
    return
  }
  const from = keys[index - 1], to = keys[index]
  if (from.positions === to.positions) { rest.set(from.positions); return }
  const previous = keys[index - 2] ?? from
  const following = keys[index + 1] ?? to
  const span = to.at - from.at
  const before = from.at - previous.at || span
  const after = following.at - to.at || span
  const t = (progress - from.at) / span
  // The leading end starts each pass before the trailing fold catches up.
  const follow = (progress >= 1 ? .31 : .24) * Math.sin(Math.PI * t) ** 2
  // Keep the broad fold moving through the body after the leading end has banked.
  const swell = [0, .10, -.11, .10, -.13, .12, .10, -.13, .11, -.12, .16, -.15][screen] ?? 0
  const head = from.points[0], tail = from.points[from.points.length - 1]
  const nextHead = to.points[0], nextTail = to.points[to.points.length - 1]
  const dx = MathUtils.lerp(tail[0] - head[0], nextTail[0] - nextHead[0], t) * frame.aspect
  const dy = MathUtils.lerp(tail[1] - head[1], nextTail[1] - nextHead[1], t)
  const scale = flutter * swell * (1 - MathUtils.smoothstep(phase, .33, .47))
    * MathUtils.lerp(.44, 1, MathUtils.smoothstep(frame.aspect, .34, .75)) / Math.max(.55, Math.hypot(dx, dy))
  const points = from.points.map((point, i) => {
    const u = i / (from.points.length - 1)
    const travel = t + (u - .5) * follow
    const place = point.map((value, j) => glide(previous.points[i][j], value, to.points[i][j], following.points[i][j], travel, before, span, after))
    const fold = scale * Math.sin(Math.PI * u) ** 2 * Math.cos((u - .36) * 5.2 - (phase - .30) * 9)
    place[0] -= dy / frame.aspect * fold
    place[1] += dx * fold
    return place
  })
  const maskFold = screen === 2 ? .12 : screen === 5 ? .105 : screen === 9 ? .135 : 0
  const cover = MathUtils.smoothstep(phase, .12, .30) * (1 - MathUtils.smoothstep(phase, .35, .50))
  const width = glide(previous.width, from.width, to.width, following.width, t, before, span, after) + maskFold * cover
  const roll = glide(previous.roll, from.roll, to.roll, following.roll, t, before, span, after)
  const taper = glide(previous.taper, from.taper, to.taper, following.taper, t, before, span, after)
  const turns = glide(previous.turns, from.turns, to.turns, following.turns, t, before, span, after)
  const peel = glide(previous.peel, from.peel, to.peel, following.peel, t, before, span, after)
  const ground = glide(previous.ground, from.ground, to.ground, following.ground, t, before, span, after)
  rest.set(landing)
  shapeScarf(rest, frame, points, width, roll, studioCollarTrim(1), true, taper, turns, flutter, phase * 18 + screen * 1.65, peel, ground)
}

export function studioCameraPose(progress: number, aspect: number, compact = aspect <= 1.5) {
  const p = MathUtils.clamp(progress, 0, 1)
  const wide = compact ? 0 : 1
  const openingDepth = MathUtils.lerp(14.15, 9.2, wide)
  const openingHalfHeight = openingDepth * Math.tan(MathUtils.degToRad(studioFov / 2))
  const openingX = studioMark.x - MathUtils.lerp(.02, .25, wide) * aspect * openingHalfHeight
  const openingY = studioMark.y + .18 - MathUtils.lerp(.26, .16, wide) * openingHalfHeight
  const extraDepth = Math.max(0, .65 / Math.max(aspect, .3) - 1) * 24
  const positions = [
    new Vector3(openingX, openingY, studioMark.z + openingDepth),
    new Vector3(5, -.12, MathUtils.lerp(20, 14.7, wide) + extraDepth * .52),
    new Vector3(MathUtils.lerp(13.6, 14.5, wide), .5, MathUtils.lerp(24, 14.65, wide) + extraDepth),
  ]
  const targets = [
    new Vector3(openingX, openingY, studioMark.z),
    new Vector3(MathUtils.lerp(5.8, 5, wide), -.65, -.4),
    studioApp.clone().add(new Vector3(0, MathUtils.lerp(-.72, -.9, wide), 0)),
  ]
  const t = MathUtils.smoothstep(p, 0, 1)
  return {
    position: new CatmullRomCurve3(positions).getPoint(t),
    target: new CatmullRomCurve3(targets).getPoint(t),
    roll: Math.sin(p * Math.PI) * -.025,
  }
}

export function studioFinaleTransform(aspect: number, compact: boolean) {
  const opening = studioCameraPose(0, aspect, compact)
  const closing = studioCameraPose(1, aspect, compact)
  const up = new Vector3(0, 1, 0)
  // Return the mascot to its opening composition in the final camera's space.
  return new Matrix4().lookAt(closing.position, closing.target, up).setPosition(closing.position)
    .multiply(new Matrix4().lookAt(opening.position, opening.target, up).setPosition(opening.position).invert())
}

/** Project a point out of a solid box, including the clearance around its surface. */
export function projectOutsideBox(point: Vector3, center: Vector3, half: Vector3) {
  const x = point.x - center.x, y = point.y - center.y, z = point.z - center.z
  const dx = half.x - Math.abs(x), dy = half.y - Math.abs(y), dz = half.z - Math.abs(z)
  if (dx <= 0 || dy <= 0 || dz <= 0) return false
  if (dx <= dy && dx <= dz) point.x = center.x + (x < 0 ? -1 : 1) * (half.x + .00001)
  else if (dy <= dz) point.y = center.y + (y < 0 ? -1 : 1) * (half.y + .00001)
  else point.z = center.z + (z < 0 ? -1 : 1) * (half.z + .00001)
  return true
}
