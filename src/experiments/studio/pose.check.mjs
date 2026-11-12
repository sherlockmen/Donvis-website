import assert from 'node:assert/strict'
import { Box2, Box3, Group, MeshStandardMaterial, PerspectiveCamera, Plane, Ray, Raycaster, Triangle, Vector2, Vector3 } from 'three'
import { appSize, collarColumns, makeStudioScarfChapters, makeStudioScarfLanding, makeStudioScarfPose, projectOutsideBox, scarfRows, scarfSegments, stageStudioScarf, stageStudioScarfChapters, studioApp, studioCameraPose, studioCollarTrim, studioDrapeFloor, studioFinaleEnd, studioFinaleStart, studioFov, studioMark, studioMarkHalf, studioQuotaCardDepth } from './pose.ts'
import { createScarfMesh } from './scarf-mesh.ts'
import { clearStudioCardEdge, createStudioScarfMotion, routeScarfGrip, stageStudioProduct, studioScarfGustPhase } from './scene.ts'
import { STUDIO_HANDOFF, STUDIO_SCROLL_HANDOFF, studioChapterProgress, studioChapterRun, studioCurtainProgress, studioCurtainRun } from './chapters.ts'

for (const phase of [.10, .20, .27, .281, .32, .343, .35, .44, .55, 1, 2]) {
  assert.ok(Math.abs(studioCurtainProgress(studioCurtainRun(phase)) - phase) < 1e-9, 'the curtain must match the same scroll position in both directions')
}
assert.ok(studioCurtainRun(.27) - studioCurtainRun(.10) > .40, 'the cloth needs room to cover the frame')
assert.ok(studioCurtainRun(.55) - studioCurtainRun(.35) > .50, 'the cloth needs room to uncover the next feature')
assert.ok(Math.abs(studioCurtainRun(2) - studioCurtainRun(1) - 1) < 1e-9, 'later chapters retain their wheel pacing')

for (const phase of [0, .60, ...Array.from({ length: studioFinaleStart - 1 }, (_, index) => index + 1.78)]) {
  const start = studioChapterRun(phase)
  for (const offset of [.03, .15, .30]) assert.equal(studioChapterProgress(start + offset), phase)
  if (phase > 0) assert.ok(studioChapterProgress(start - .01) < phase)
  assert.ok(studioChapterProgress(start + .34) > phase)
}
for (const phase of [.27, .48, .55, 1.4, studioFinaleStart, studioFinaleStart + .45]) {
  assert.ok(Math.abs(studioChapterProgress(studioChapterRun(phase)) - phase) < 1e-9)
}

const pose = makeStudioScarfPose()
assert.ok(pose.positions.every(Number.isFinite))
const center = studioApp.clone()
const half = new Vector3(appSize.width / 2 + .12, appSize.height / 2 + .12, .23)
assert.ok(projectOutsideBox(center, studioApp, half))
assert.ok(!projectOutsideBox(center, studioApp, half), 'projection must leave the solid')
const cols = scarfSegments + 1
function outside(point, solid, extent) {
  return Math.abs(point.x - solid.x) >= extent.x || Math.abs(point.y - solid.y) >= extent.y || Math.abs(point.z - solid.z) >= extent.z
}
function intersectsViewport(a, b) {
  let from = 0, to = 1
  for (const axis of ['x', 'y']) {
    const span = b[axis] - a[axis]
    if (Math.abs(span) < 1e-7) {
      if (Math.abs(a[axis]) > 1) return false
      continue
    }
    const near = (-1 - a[axis]) / span, far = (1 - a[axis]) / span
    from = Math.max(from, Math.min(near, far))
    to = Math.min(to, Math.max(near, far))
    if (from > to) return false
  }
  return true
}
const rest = Array.from({ length: pose.positions.length / 3 }, (_, i) => new Vector3().fromArray(pose.positions, i * 3))
const collarCenter = Math.floor(scarfRows / 2) * cols
function lapAtCenter(from, to) {
  const lap = rest.slice(collarCenter + Math.round(collarColumns * from), collarCenter + Math.round(collarColumns * to))
  return lap.reduce((nearest, point) => Math.abs(point.x - 1.4) < Math.abs(nearest.x - 1.4) ? point : nearest)
}
const upperLap = lapAtCenter(.17, .32)
const rearLap = lapAtCenter(.41, .59)
const lowerLap = lapAtCenter(.78, .92)
assert.ok(upperLap.z - rearLap.z > .7 && lowerLap.z - upperLap.z > .2, 'the rear turn and front laps must have separate depths')
assert.ok(upperLap.y - lowerLap.y > .22 && upperLap.y - lowerLap.y < .48, 'the front rolls must overlap without hiding each other')
const exit = rest[collarCenter + collarColumns]
const entryTangent = exit.clone().sub(rest[collarCenter + collarColumns - 1]).normalize()
const exitTangent = rest[collarCenter + collarColumns + 1].clone().sub(exit).normalize()
assert.ok(entryTangent.dot(exitTangent) > .94, 'the collar must roll smoothly into the loose scarf')
let previousAcross
for (let column = 0; column <= scarfSegments; column++) {
  const across = rest[scarfRows * cols + column].clone().sub(rest[column]).normalize()
  if (previousAcross) assert.ok(across.dot(previousAcross) > .7, 'the ribbon width must turn without flipping at a fold')
  previousAcross = across
}
for (const [i, point] of rest.entries()) {
  if (i % cols <= collarColumns) continue
  assert.ok(outside(point, studioMark, studioMarkHalf) && outside(point, studioApp, half), 'rest pose must clear both solids')
  assert.ok(point.y >= -5.02, 'rest pose must clear the floor clamp')
}
const material = new MeshStandardMaterial()
const coordinates = new Vector2()
const pointerRay = new Raycaster()
const origin = new Vector3(), target = new Vector3(), vertex = new Vector3(), projected = new Vector3()
const triangle = new Triangle()
const weights = new Vector3()
const dt = 1 / 60
const centerRow = Math.floor(scarfRows / 2) * cols
for (const [progress, aspect, along, chapter] of [[0, 1.78, .15], [0, .45, .15], [.55, 1.78, .52], [1, .45, .73], [1, .45, .67, 3.65], [1, 1.78, .58, 9.65], [1, 1.78, .43, .65], [1, 1.78, .50, .30]]) {
  const column = collarColumns + Math.round(along * (scarfSegments - collarColumns))
  const { positions: opening } = makeStudioScarfPose(aspect)
  const positions = opening.slice()
  const landing = makeStudioScarfLanding(opening, aspect)
  const chapters = chapter ? makeStudioScarfChapters(landing, aspect, aspect <= 1.5) : undefined
  if (chapters) stageStudioScarfChapters(positions, chapters, chapter)
  else stageStudioScarf(positions, opening, landing, progress)
  const rest = Array.from({ length: positions.length / 3 }, (_, i) => new Vector3().fromArray(positions, i * 3))
  const cloth = createStudioScarfMotion(positions)
  const clothMesh = createScarfMesh(cloth.positions, scarfSegments, scarfRows, material)
  clothMesh.retractCollar(studioCollarTrim(progress))
  clothMesh.update()
  const boardVisible = progress > .2 && !chapters
  const markVisible = progress < 1
  const camera = new PerspectiveCamera(studioFov, aspect, .1, 100)
  const { position, target: lookAt, roll } = studioCameraPose(progress, aspect)
  camera.position.copy(position)
  camera.up.set(Math.sin(roll), Math.cos(roll), 0)
  camera.lookAt(lookAt); camera.updateMatrixWorld()
  projected.copy(rest[centerRow + column]).project(camera)
  assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1, 'the tested grab must be inside the viewport')
  pointerRay.setFromCamera(coordinates.set(projected.x, projected.y), camera)
  const hit = pointerRay.intersectObject(clothMesh.mesh)[0]
  const firstFree = progress === 1 ? studioCollarTrim(1) : collarColumns + .13 * (scarfSegments - collarColumns)
  assert.ok(hit?.uv?.x > firstFree / scarfSegments && hit.face, 'grab must begin on a visible, free part of the shell')
  const shellPositions = clothMesh.mesh.geometry.attributes.position.array
  const { a, b, c } = hit.face
  origin.copy(hit.point)
  triangle.a.fromArray(shellPositions, a * 3)
  triangle.b.fromArray(shellPositions, b * 3)
  triangle.c.fromArray(shellPositions, c * 3)
  triangle.getBarycoord(origin, weights)
  const dragPlane = new Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(vertex), origin)
  cloth.startGrab(hit.uv.x, origin, hit.uv.y)
  let maxDistance = 0
  for (let frame = 0; frame <= 90; frame++) {
    const angle = frame / 90 * Math.PI * 2
    if (chapters && frame === 45) stageStudioScarfChapters(positions, chapters, chapter + .31)
    pointerRay.setFromCamera(coordinates.set(.92 * Math.cos(angle), .86 * Math.sin(angle)), camera)
    assert.ok(pointerRay.ray.intersectPlane(dragPlane, target))
    cloth.moveGrab(routeScarfGrip(target, pointerRay.ray, boardVisible, markVisible))
    cloth.step(dt, 0, boardVisible, false, markVisible, chapter > .58 ? 1 : 0)
    clothMesh.update()
    projected.fromArray(shellPositions, a * 3).multiplyScalar(weights.x)
    projected.addScaledVector(vertex.fromArray(shellPositions, b * 3), weights.y)
    projected.addScaledVector(vertex.fromArray(shellPositions, c * 3), weights.z)
    maxDistance = Math.max(maxDistance, projected.distanceTo(origin))
    projected.project(camera)
    assert.ok(Math.hypot(projected.x - coordinates.x, projected.y - coordinates.y) < .002, 'the grabbed material point must follow the cursor across a full circle')
    assert.ok(cloth.positions.every(Number.isFinite) && clothMesh.mesh.geometry.attributes.normal.array.every(Number.isFinite))
    for (let i = 0; i < rest.length; i++) {
      vertex.fromArray(cloth.positions, i * 3)
      if (i % cols <= collarColumns) assert.ok(vertex.equals(rest[i]), 'the collar must stay attached')
      else {
        if (markVisible) assert.ok(outside(vertex, studioMark, studioMarkHalf), 'free cloth must clear the relief')
        if (boardVisible) assert.ok(outside(vertex, studioApp, half), 'free cloth must clear the product panel')
        assert.ok(vertex.y >= -5.020001, 'free cloth must stay above the floor')
      }
    }
  }
  assert.ok(maxDistance > (chapter === .30 ? .4 : 3), 'a full-screen drag must visibly move the cloth in its current depth plane')
  cloth.endGrab()
  for (let frame = 0; frame < 90; frame++) cloth.step(dt, 0, boardVisible, false, markVisible)
  assert.deepEqual(cloth.positions, positions, 'release must return to the current scroll pose')
  clothMesh.dispose()
}

const cloth = createStudioScarfMotion(pose.positions)
const passive = createStudioScarfMotion(pose.positions)
const hoverColumn = collarColumns + Math.round(.2 * (scarfSegments - collarColumns))
const hoverIndex = (centerRow + hoverColumn) * 3
const ambientOrigin = rest[centerRow + hoverColumn]
cloth.reset(); cloth.hover(hoverColumn / scarfSegments)
let idleTravel = 0, hoverTravel = 0
for (let frame = 0; frame < 120; frame++) {
  passive.step(dt, 1, false, false)
  cloth.step(dt, 1, false, false)
  vertex.fromArray(passive.positions, hoverIndex)
  idleTravel = Math.max(idleTravel, vertex.distanceTo(ambientOrigin))
  hoverTravel = Math.max(hoverTravel, vertex.distanceTo(projected.fromArray(cloth.positions, hoverIndex)))
}
assert.ok(idleTravel > .2 && hoverTravel > .3, 'idle breeze and hover should both visibly move the fabric')
cloth.step(dt, 1, false, true)
assert.deepEqual(cloth.positions, pose.positions, 'reduced motion must stop ambient movement')

const chapterLanding = makeStudioScarfLanding(pose.positions, 1.78, false)
const chapterRest = chapterLanding.slice()
stageStudioScarfChapters(chapterRest, makeStudioScarfChapters(chapterLanding, 1.78, false), 3.65)
const chapterCloth = createStudioScarfMotion(chapterRest)
const chapterIdle = createStudioScarfMotion(chapterRest)
chapterCloth.hover(hoverColumn / scarfSegments, .15)
for (let frame = 0; frame < 45; frame++) {
  chapterCloth.step(dt, .14, false, false, false, 1)
  chapterIdle.step(dt, .14, false, false, false, 1)
  if (frame === 0) assert.ok(vertex.fromArray(chapterCloth.positions, hoverIndex).distanceTo(projected.fromArray(chapterIdle.positions, hoverIndex)) > .12,
    'a brief pointer pass must visibly lift the cloth')
}
assert.ok(vertex.fromArray(chapterCloth.positions, hoverIndex).distanceTo(projected.fromArray(chapterIdle.positions, hoverIndex)) > .24,
  'light chapter wind must not weaken the local pointer response')
chapterCloth.hover(null)
for (let frame = 0; frame < 40; frame++) {
  chapterCloth.step(dt, .14, false, false, false, 1)
  chapterIdle.step(dt, .14, false, false, false, 1)
}
assert.ok(vertex.fromArray(chapterCloth.positions, hoverIndex).distanceTo(projected.fromArray(chapterIdle.positions, hoverIndex)) < .01,
  'the local fold must relax after the pointer leaves')
chapterCloth.reset()
const grip = vertex.fromArray(chapterRest, hoverIndex)
chapterCloth.startGrab(hoverColumn / scarfSegments, grip)
chapterCloth.moveGrab(grip.clone().add(new Vector3(1, 0, 0)))
chapterCloth.step(dt, 0, false, false, false, 1)
assert.ok(Math.abs(chapterCloth.positions[hoverIndex] - grip.x - 1) < 1e-5, 'the held patch must move before its neighboring folds')
const tail = (centerRow + scarfSegments) * 3
const shoulder = hoverIndex + 25 * 3
const firstPull = chapterCloth.positions[shoulder]
for (let frame = 0; frame < 45; frame++) chapterCloth.step(dt, 0, false, false, false, 1)
assert.ok(chapterCloth.positions[shoulder] - firstPull > .3, 'the near fold must follow the grip with a short delay')
assert.ok(Math.abs(chapterCloth.positions[tail] - chapterRest[tail]) < .02, 'a short pull must leave distant cloth on the floor')

const frames = 200
const panelExtent = new Vector3(appSize.width / 2 + .04, appSize.height / 2 + .04, .102)
const panelBounds = new Box3(studioApp.clone().sub(panelExtent), studioApp.clone().add(panelExtent))
const panelClearance = new Box3(studioApp.clone().sub(half), studioApp.clone().add(half))
const product = new Group()
const hitPoint = new Vector3()
for (const aspect of [2.38, 2.05, 1.78, 1.6, 1.51, 1.5, 1.49, 1.25, .73, .65, 390 / 844, .35]) {
  const productPose = progress => [stageStudioProduct(product, progress, aspect), ...product.position.toArray(), product.scale.x]
  const lifted = productPose(.68)
  assert.ok(lifted[0] > 0 && lifted[0] < 1 && lifted[2] < studioApp.y, 'the panel must rise while the fold is passing')
  assert.deepEqual(productPose(1), [1, ...studioApp.toArray(), 1], 'the panel must settle at its original size and position')
  assert.deepEqual(productPose(.68), lifted, 'reverse scrolling must retrace the panel lift')
  const { positions } = makeStudioScarfPose(aspect)
  const landing = makeStudioScarfLanding(positions, aspect)
  const travel = positions.slice()
  const lead = (centerRow + collarColumns + 4) * 3
  stageStudioScarf(travel, positions, landing, .46)
  const halfway = travel.slice()
  assert.ok(halfway[lead] - positions[lead] > 3, 'the released scarf must travel into the product shot rather than leave with the opening')
  stageStudioScarf(travel, positions, landing, .85)
  assert.deepEqual(travel, landing, 'the cloth must finish settling before the camera stops')
  stageStudioScarf(travel, positions, landing, .46)
  assert.deepEqual(travel, halfway, 'reverse scrolling must retrace the cloth motion')
  stageStudioScarf(travel, positions, landing, .10)
  assert.deepEqual(travel, positions, 'the opening scarf must be restored exactly')
  stageStudioScarf(travel, positions, landing, .23)
  const lap = (centerRow + 31) * 3
  assert.ok(studioCollarTrim(.23) < 31 && Math.hypot(
    travel[lap] - positions[lap], travel[lap + 1] - positions[lap + 1], travel[lap + 2] - positions[lap + 2],
  ) > .1, 'the loose lap must visibly move while it is still on-screen')
  const responsiveRest = Array.from({ length: positions.length / 3 }, (_, i) => new Vector3().fromArray(positions, i * 3))
  for (const [i, point] of responsiveRest.entries()) {
    if (i % cols <= collarColumns) continue
    assert.ok(outside(point, studioMark, studioMarkHalf) && outside(point, studioApp, half) && point.y >= -5.02, 'each aspect must keep the free scarf clear of solids and floor')
  }
  let previous
  const forward = []
  const camera = new PerspectiveCamera(studioFov, aspect, .1, 100)
  for (let i = 0; i <= frames; i++) {
    const current = studioCameraPose(i / frames, aspect)
    const { position, target, roll } = current
    assert.ok([...position.toArray(), ...target.toArray(), roll].every(Number.isFinite))
    if (previous) {
      assert.ok(position.distanceTo(previous.position) < .25 && target.distanceTo(previous.target) < .25, 'three-part camera path must not jump between beats')
      assert.ok(Math.abs(roll - previous.roll) < .001, 'camera roll must change continuously')
    }
    previous = current
    forward.push([...position.toArray(), ...target.toArray(), roll])
    camera.position.copy(position)
    camera.up.set(Math.sin(roll), Math.cos(roll), 0)
    camera.lookAt(target); camera.updateMatrixWorld()
    if (i % 4 === 0) {
      stageStudioProduct(product, i / frames, aspect)
      for (const [rx, ry, rz] of [[-.027, 0, 0], [.027, 0, 0], [0, -.027, .012], [0, .027, -.012]]) {
        product.rotation.set(rx, ry, rz)
        product.updateMatrixWorld(true)
        for (const x of [-panelExtent.x, panelExtent.x]) for (const y of [-panelExtent.y, panelExtent.y]) for (const z of [-.09, .102]) {
          assert.ok(panelClearance.containsPoint(hitPoint.set(x, y, z).applyMatrix4(product.matrixWorld)), 'the entering panel must stay inside its cloth collision envelope')
        }
      }
      stageStudioScarf(travel, positions, landing, i / frames)
      for (let column = collarColumns + 1; column <= scarfSegments; column++) for (let row = 0; row <= scarfRows; row++) {
        vertex.fromArray(travel, (row * cols + column) * 3)
        assert.ok(outside(vertex, studioApp, half) && vertex.y >= -5.020001, 'the moving cloth must clear the panel and floor')
      }
    }
    if (i === 0) {
      const low = studioMark.clone().add(new Vector3(-1.3, -1.33, .11)).project(camera)
      const high = studioMark.clone().add(new Vector3(1.28, 1.70, .11)).project(camera)
      const horizontal = .5 + (low.x + high.x) / 4
      const vertical = .5 - (low.y + high.y) / 4
      const height = (high.y - low.y) / 2
      const visibleTail = responsiveRest.filter((_, index) => index % cols > collarColumns)
        .map(point => point.clone().project(camera))
        .map(point => [(1 + point.x) / 2, (1 - point.y) / 2])
        .filter(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1)
      if (aspect > 1.5) {
        assert.ok(horizontal > .61 && horizontal < .65 && vertical > .4 && vertical < .44 && height > .47 && height < .5, 'wide opening must frame the mark beside the slogan')
        assert.ok(visibleTail.every(([x, y]) => x >= .39 || y >= .61), 'the wide scarf must leave the slogan clear')
        assert.ok(visibleTail.some(([x, y]) => x > .53 && x < .72 && y > .79), 'the wide scarf must sweep under the mark')
      } else {
        assert.ok(horizontal > .5 && horizontal < .53 && vertical > .35 && vertical < .39 && height > .29 && height < .33, 'compact opening must frame the mark above the slogan')
        const sloganHalfWidth = Math.min(.4, .23 / aspect)
        assert.ok(visibleTail.every(([x, y]) => Math.abs(x - .5) > sloganHalfWidth || y < .71), 'the compact scarf must stay above the slogan')
        assert.ok(visibleTail.some(([x, y]) => x > .34 && x < .66 && y > .62), 'the compact scarf must sweep under the mark')
      }
    }
    if (i >= frames * .86) {
      // Conservative relief bounds include the original contour and bevels.
      for (const x of [-1.38, 1.38]) for (const y of [-1.75, 1.75]) for (const z of [-.195, .11]) {
        const corner = studioMark.clone().add(new Vector3(x, y, z)).project(camera)
        assert.ok(corner.x < -.9, 'whole brand must leave the final product view')
      }
    }
    if (i === frames) {
      for (const x of [-appSize.width / 2 - .04, appSize.width / 2 + .04]) for (const y of [-appSize.height / 2 - .04, appSize.height / 2 + .04]) for (const z of [-.09, .102]) {
        const corner = studioApp.clone().add(new Vector3(x, y, z)).project(camera)
        assert.ok(Math.abs(corner.x) < 1 && Math.abs(corner.y) < 1 && corner.z > -1 && corner.z < 1, `whole product panel must end in frame at aspect ${aspect}`)
      }
      const ray = new Ray(position)
      let lowest = 1, highest = -1, left = 1, right = -1, tucked = 0, onFloor = 0
      for (let index = 0; index < landing.length / 3; index++) {
        if (index % cols < studioCollarTrim(1)) continue
        const point = vertex.fromArray(landing, index * 3)
        ray.direction.copy(point).sub(position).normalize()
        if (ray.intersectBox(panelBounds, hitPoint)) {
          assert.ok(position.distanceTo(point) > position.distanceTo(hitPoint) + .024, 'scarf must pass behind the visible panel at the final shot')
          tucked++
        }
        projected.copy(point).project(camera)
        if (point.y < -4.85 && Math.abs(projected.x) < 1) onFloor++
        assert.ok(projected.x > -1 && Math.abs(projected.y) < 1, 'settled scarf must stay clear of the top, bottom and left edges')
        lowest = Math.min(lowest, projected.y)
        highest = Math.max(highest, projected.y)
        left = Math.min(left, projected.x); right = Math.max(right, projected.x)
      }
      assert.ok(tucked >= scarfRows && highest - lowest > .42 && right - left > .93 && lowest < -.70, 'the short end must tuck behind the app before the scarf sweeps below it')
      assert.ok(onFloor > scarfRows * 24, 'the overview coil must have a substantial length on the floor')
      const tip = vertex.fromArray(landing, (centerRow + scarfSegments) * 3).project(camera)
      assert.ok(tip.x > 1.15, 'the floor coil must continue beyond the right edge')
      assert.ok(Math.abs(roll) < 1e-12, 'final product shot must be level')
    }
  }
  for (let i = frames; i >= 0; i--) {
    const { position, target, roll } = studioCameraPose(i / frames, aspect)
    assert.deepEqual([...position.toArray(), ...target.toArray(), roll], forward[i], 'reverse scrolling must retrace the camera path')
  }

  const chapters = makeStudioScarfChapters(landing, aspect, aspect <= 1.5)
  assert.ok(chapters.keys.every((key, index, keys) => !index || key.at > keys[index - 1].at), 'chapter holds must keep the keyframes in scroll order')
  for (const [screen, from, to] of [[7, .23, .29], [9, .39, .44], [11, .31, .37]]) {
    const at = phase => screen + STUDIO_SCROLL_HANDOFF.lead + (phase - STUDIO_HANDOFF.lead)
      * (STUDIO_SCROLL_HANDOFF.rest - STUDIO_SCROLL_HANDOFF.lead) / (STUDIO_HANDOFF.rest - STUDIO_HANDOFF.lead)
    stageStudioScarfChapters(travel, chapters, at(from + (to - from) * .25))
    const pause = travel.slice()
    stageStudioScarfChapters(travel, chapters, at(from + (to - from) * .75))
    assert.deepEqual(travel, pause, `the suspended fold must pause visibly on screen ${screen}`)
    for (const phase of [from - .015, to + .015]) {
      stageStudioScarfChapters(travel, chapters, at(phase))
      assert.notDeepEqual(travel, pause, `the scarf must enter and leave its intermediate pause on screen ${screen}`)
    }
  }
  const first = studioCollarTrim(1)
  function centerline(at, along) {
    stageStudioScarfChapters(travel, chapters, at)
    return new Vector3().fromArray(travel, (centerRow + first + Math.round((scarfSegments - first) * along)) * 3)
  }
  function endOutside(column) {
    const cap = Array.from({ length: scarfRows + 1 }, (_, row) => new Vector3().fromArray(travel, (row * cols + column) * 3).project(camera))
    return ['x', 'y'].some(axis => cap.every(point => point[axis] > 1.015) || cap.every(point => point[axis] < -1.015))
  }
  for (let screen = 0; screen < studioFinaleStart; screen++) {
    stageStudioScarfChapters(travel, chapters, screen + .85)
    assert.notEqual(endOutside(first), endOutside(scarfSegments), `one end must continue outside the viewport on screen ${screen} at aspect ${aspect}`)
    if (screen === 9 || screen === 11) {
      const foreground = Array.from({ length: 33 }, (_, index) => centerline(screen + .85, index / 32).project(camera))
        .filter(({ x, y }) => Math.abs(x) < .98 && Math.abs(y) < .98)
      assert.ok(foreground.length >= 12 && foreground.every(({ y }) => y < -.4),
        `the menu and share drapes must rest in the lower foreground instead of framing the page at aspect ${aspect}`)
    }
    let grounded = 0, lyingFlat = 0
    for (let column = first; column <= scarfSegments; column++) {
      let touchesFloor = false, height = -Infinity
      for (let row = 0; row <= scarfRows; row++) {
        vertex.fromArray(travel, (row * cols + column) * 3)
        height = Math.max(height, vertex.y - studioDrapeFloor)
        if (Math.abs(vertex.y - studioDrapeFloor) >= .09) continue
        vertex.project(camera)
        if (Math.max(Math.abs(vertex.x), Math.abs(vertex.y)) < 1) touchesFloor = true
      }
      if (touchesFloor) {
        grounded++
        if (height < .31) lyingFlat++
      }
    }
    assert.ok(grounded >= 12, `the scarf must visibly settle on the floor on screen ${screen} at aspect ${aspect}`)
    if (screen === 10) assert.ok(lyingFlat >= 100, `the settings fold must lie flat across its width at aspect ${aspect}`)
    if ([3, 7, 9, 11].includes(screen)) assert.ok(lyingFlat >= 45, `the low folds must rest across their width on screen ${screen} at aspect ${aspect}`)
  }
  stageStudioScarfChapters(travel, chapters, .27)
  const wipe = travel.slice()
  stageStudioScarfChapters(travel, chapters, .35)
  assert.deepEqual(travel, wipe, 'the close-up must hold through the chapter intro')
  const wool = createScarfMesh(travel, scarfSegments, scarfRows, material)
  wool.retractCollar(first)
  wool.update()
  for (let y = -1; y <= 1.01; y += .25) for (let x = -1; x <= 1.01; x += .25) {
    pointerRay.setFromCamera(coordinates.set(x, y), camera)
    assert.ok(pointerRay.intersectObject(wool.mesh)[0]?.distance < 2.5, 'the actual close-up wool must fill the frame in front of the camera')
  }
  stageStudioScarfChapters(travel, chapters, .430)
  wool.update()
  pointerRay.setFromCamera(coordinates.set(.22, .76), camera)
  assert.equal(pointerRay.intersectObject(wool.mesh).length, 0, 'the rolled edge must uncover the upper feature first')
  pointerRay.setFromCamera(coordinates.set(.22, -.06), camera)
  assert.ok(pointerRay.intersectObject(wool.mesh).length > 0, 'the center must stay covered while the upper edge rolls away')
  stageStudioScarfChapters(travel, chapters, .458)
  wool.update()
  assert.equal(pointerRay.intersectObject(wool.mesh).length, 0, 'the first curtain must uncover the product area')
  pointerRay.setFromCamera(coordinates.set(.22, -.68), camera)
  assert.ok(pointerRay.intersectObject(wool.mesh).length > 0, 'the loose length must keep moving through the lower feature after the center clears')
  const lipColumn = first + Math.round((scarfSegments - first) * .62)
  const crossSection = (row) => new Vector3().fromArray(travel, (row * cols + lipColumn) * 3)
  const bodyEdge = crossSection(Math.round(scarfRows * .67)).sub(crossSection(Math.floor(scarfRows / 2))).normalize()
  const curledEdge = crossSection(scarfRows).sub(crossSection(scarfRows - 1)).normalize()
  assert.ok(bodyEdge.dot(curledEdge) < .65, 'the wool lip must curve around its width while it releases')
  if (aspect === 1.6 || aspect === 390 / 844) {
    const settledEnd = (screen, along) => centerline(screen + .85, along).project(camera).setZ(0)
    let previousFringe = settledEnd(0, 1)
    let previousHead = settledEnd(0, 0)
    for (let screen = 1; screen < studioFinaleStart; screen++) {
      const fringe = settledEnd(screen, 1)
      if (![9, 10, 11].includes(screen)) assert.ok(fringe.distanceTo(previousFringe) > .8,
        `the fringe must land somewhere new on screen ${screen} at aspect ${aspect}`)
      previousFringe = fringe
      const headPath = Array.from({ length: 79 }, (_, frame) => centerline(screen + frame / 100, 0).project(camera).setZ(0))
        .filter(({ x, y }) => Math.max(Math.abs(x), Math.abs(y)) < .96)
      assert.ok(headPath.some((point, i) => headPath.slice(i + 1).some(next => point.distanceToSquared(next) >= .27 ** 2)),
        `the plain end must travel visibly on screen ${screen} at aspect ${aspect}`)
      const head = settledEnd(screen, 0)
      if (![9, 10, 11].includes(screen)) assert.ok(head.distanceTo(previousHead) > 1.2,
        `the plain end must land somewhere new on screen ${screen} at aspect ${aspect}`)
      previousHead = head
      const outline = Array.from({ length: 17 }, (_, i) => settledEnd(screen, i / 16).clampScalar(-1, 1))
      const visibleLength = outline.slice(1).reduce((length, point, i) => length + point.distanceTo(outline[i]), 0)
      if (screen === 2) {
        assert.ok(visibleLength >= 1.68 && visibleLength < 2.1, `the balance drape must gather into a shorter span at aspect ${aspect}`)
      } else if (screen === 9 || screen === 11) {
        assert.ok(visibleLength >= 1.2 && visibleLength < 2.5, `the foreground fold must gather into an open curve on screen ${screen} at aspect ${aspect}`)
      } else {
        assert.ok(visibleLength >= 2.1, `the settled cloth must keep its visible length on screen ${screen} at aspect ${aspect}`)
      }
      if (screen === 1) {
        assert.ok(settledEnd(screen, .72).y - fringe.y > .18,
          `the loose end must fall diagonally away from the preview on screen ${screen} at aspect ${aspect}`)
      }
      for (const along of [.14, .86]) {
        const path = Array.from({ length: 79 }, (_, frame) => centerline(screen + frame / 100, along).project(camera).setZ(0))
          .filter(({ x, y }) => Math.abs(x) < .93 && Math.abs(y) < .92)
        assert.ok(path.some((point, i) => path.slice(i + 1).some(next => point.distanceToSquared(next) >= .3 ** 2)),
          `both shoulders must travel at least 15% of the frame in view on screen ${screen} at aspect ${aspect} (u=${along})`)
      }
      let broadFrames = 0
      for (const phase of [.23, .30, .37, .44, .51, .58, .65]) {
        stageStudioScarfChapters(travel, chapters, screen + phase)
        wool.update()
        let hits = 0
        for (let y = -.4; y <= .41; y += .20) for (let x = -.54; x <= .75; x += .21) {
          pointerRay.setFromCamera(coordinates.set(x, y), camera)
          if (pointerRay.intersectObject(wool.mesh).length) hits++
        }
        if (hits >= 6) broadFrames++
      }
      assert.ok(broadFrames >= 4, `the scarf must visibly sweep through several scroll positions on screen ${screen} at aspect ${aspect} (${broadFrames})`)
    }
  }
  if (aspect === 1.6) {
    const hitDepth = ([x, y]) => {
      pointerRay.setFromCamera(coordinates.set(2 * x - 1, 1 - 2 * y), camera)
      const hit = pointerRay.intersectObject(wool.mesh)[0]
      return hit ? -hit.point.applyMatrix4(camera.matrixWorldInverse).z : Infinity
    }
    for (const [screen, corner, interior] of [[1, [.863, .777], [.807, .704]], [4, [.395, .777], [.42, .735]]]) {
      stageStudioScarfChapters(travel, chapters, screen + .85)
      wool.update()
      if (screen === 1) {
        const rear = hitDepth([.815, .36])
        assert.ok(rear > studioQuotaCardDepth && Number.isFinite(rear), 'the short end must tuck behind the quota card')
        assert.ok(hitDepth(corner) < studioQuotaCardDepth, 'the lower fold must overlap the front of the quota card')
        assert.ok(hitDepth(interior) > studioQuotaCardDepth, 'the front fold must clear the balance figures')
      } else {
        assert.ok(Number.isFinite(hitDepth(corner)), 'the conversation drape must touch the preview corner')
        assert.equal(hitDepth(interior), Infinity, 'the conversation drape must leave the table readable')
      }
    }
  }
  if (aspect === 1.6 || aspect === 390 / 844) {
    stageStudioScarfChapters(travel, chapters, 8.85)
    wool.update()
    const [x, y] = aspect === 1.6 ? [.224, .383] : [.068, .16]
    pointerRay.setFromCamera(coordinates.set(2 * x - 1, 1 - 2 * y), camera)
    assert.ok(pointerRay.intersectObject(wool.mesh).length > 0, 'the settled account drape must meet the heading edge')
  }
  stageStudioScarfChapters(travel, chapters, studioFinaleEnd)
  wool.retractCollar(0)
  wool.update()
  const pieceMatrix = wool.mesh.matrix.clone()
  for (const piece of [wool.mesh, ...wool.mesh.children]) {
    const vertices = piece.geometry.attributes.position
    for (let instance = 0; instance < (piece.isInstancedMesh ? piece.count : 1); instance++) {
      if (piece.isInstancedMesh) piece.getMatrixAt(instance, pieceMatrix)
      else pieceMatrix.identity()
      for (let index = 0; index < vertices.count; index++) {
        projected.fromBufferAttribute(vertices, index).applyMatrix4(pieceMatrix).project(camera)
        assert.ok(Math.abs(projected.x) < .98 && Math.abs(projected.y) < .98,
          `the settled finale scarf and fringe must fit in frame at aspect ${aspect}`)
        if (aspect <= 1.5) assert.ok(projected.y > -.50, 'the settled fringe must clear the compact closing slogan')
      }
    }
  }
  const narrowFinale = aspect <= 1.5
  const [upper, gapStart, gapEnd, lower] = narrowFinale ? [.600, .634, .653, .691] : [.767, .812, .829, .888]
  for (const x of narrowFinale ? [.50, .55, .59] : [.65, .70, .75]) {
    for (const [y, hit] of [[upper, true], [gapStart, false], [gapEnd, false], [lower, true]]) {
      pointerRay.setFromCamera(coordinates.set(2 * x - 1, 1 - 2 * y), camera)
      assert.equal(pointerRay.intersectObject(wool.mesh).length > 0, hit, `the two finale folds must read separately at aspect ${aspect}`)
    }
  }
  wool.dispose()
  const crest = STUDIO_SCROLL_HANDOFF.lead + (STUDIO_SCROLL_HANDOFF.rest - STUDIO_SCROLL_HANDOFF.lead)
    * (STUDIO_HANDOFF.crest - STUDIO_HANDOFF.lead) / (STUDIO_HANDOFF.rest - STUDIO_HANDOFF.lead)
  const tokenStart = centerline(3 + crest, .12).project(camera)
  const tokenEnd = centerline(3 + crest, .88).project(camera)
  assert.ok(tokenEnd.x - tokenStart.x > 1.4 && tokenStart.y - tokenEnd.y > .95, 'Token keeps its broad diagonal sweep')
  const serviceSpan = centerline(6 + crest, .75).project(camera).x - centerline(6 + crest, .10).project(camera).x
  assert.ok(serviceSpan > 2.1, 'the service directory keeps its full-width sweep')
  if (aspect === 1.6 || aspect === 390 / 844) {
    for (const phase of [.33, .40, .45]) {
      const visible = Array.from({ length: 33 }, (_, i) => centerline(10 + phase, i / 32).project(camera))
        .filter(({ x, y }) => Math.abs(x) < .95 && Math.abs(y) < .95)
        .map(({ x, y }) => new Vector2(x * aspect, y))
      const first = visible[0], last = visible.at(-1)
      assert.ok(visible.length > 10 && first.distanceTo(last) > .65, 'the settings sweep must stay in view')
      const chord = last.clone().sub(first).normalize()
      const sag = Math.max(...visible.map(point => Math.abs(point.sub(first).cross(chord))))
      assert.ok(sag > .07, 'the settings scarf must keep a visible bend while it travels')
    }
  }
  const folds = []
  const samples = Array.from({ length: studioFinaleStart * 200 + 1 }, (_, frame) => frame / 200)
    .filter(at => at < .56 || at % 1 <= STUDIO_SCROLL_HANDOFF.rest + .01 && at % 1 >= .02 || Math.round(at * 200) % 10 === 0)
  const chapterFrames = samples.length - 1
  const across = new Vector3(), previousAcross = new Vector3()
  const earlier = new Vector3(), later = new Vector3(), incoming = new Vector2(), outgoing = new Vector2()
  const visible = new Uint8Array(cols)
  const previousRow = Array.from({ length: cols }, () => new Vector2())
  for (let frame = 0; frame <= chapterFrames; frame++) {
    const at = samples[frame]
    stageStudioScarfChapters(travel, chapters, at)
    assert.ok(travel.every(Number.isFinite), 'all chapter vertices must be finite')
    if (frame === 0) assert.deepEqual(travel, landing, 'the same cloth must start exactly where the product shot ends')
    const previousDrape = at >= 1 && at % 1 <= STUDIO_SCROLL_HANDOFF.lead
    const settledScreen = Math.floor(at) - Number(previousDrape)
    const quiet = at % 1 >= (at < 1 ? .55 : STUDIO_SCROLL_HANDOFF.rest) || previousDrape
    const compact = aspect <= 1.5
    visible.fill(0)
    for (let row = 0; row <= scarfRows; row++) for (let column = first; column <= scarfSegments; column++) {
      const i = (row * cols + column) * 3
      vertex.fromArray(travel, i)
      if (at < .36) assert.ok(outside(vertex, studioApp, half), `the cloth must clear the fading product board at ${aspect}, ${at}, ${row}, ${column}`)
      assert.ok(vertex.y >= -5.020001, 'chapter fold must clear the floor')
      if (row === 0) {
        across.fromArray(travel, (scarfRows * cols + column) * 3).sub(vertex)
        assert.ok(across.length() > .14, `the cloth must retain its width through the twist at ${aspect}, ${at}, ${column}`)
        across.normalize()
        if (column > first) assert.ok(across.dot(previousAcross) > .9, `the width axis must not sharply flip between adjacent columns at ${aspect}, ${at}, ${column}`)
        previousAcross.copy(across)
      }
      projected.copy(vertex).project(camera)
      if (row > 0 && !visible[column] && intersectsViewport(previousRow[column], projected)) visible[column] = 1
      previousRow[column].set(projected.x, projected.y)
      if (quiet) {
        const x = .5 + projected.x / 2, y = .5 - projected.y / 2
        const overContent = compact
          ? x >= .06 && x <= .94 && y >= .11 && y <= .76
          : x >= .36 && x <= .94 && y >= .15 && y <= .79 || x >= .08 && x <= .34 && y >= .29 && y <= .61
        const previewCorner = compact
          ? y >= .66 && (x <= .21 || x >= .82)
          : x >= .77 && y >= .66 || x >= .60 && y >= .73 || x <= .40 && y >= .78
        const quotaBack = settledScreen === 1 && x >= .6 && -hitPoint.copy(vertex).applyMatrix4(camera.matrixWorldInverse).z > studioQuotaCardDepth
        const quotaCorner = settledScreen === 1 && compact && (x >= .898 && y >= .627 || x >= .775 && y >= .724)
        const conversationCorner = settledScreen === 4 && !compact && x <= .481 && y >= .714
        const accountTuck = settledScreen === 8 && (compact
          ? x <= .14 && (y <= .24 || y >= .57) || x <= .086
          : x >= .21 && x <= .475 && y >= .29 || x >= .165 && x <= .21 && y >= .285 && y <= .38)
        const belowSettingsCopy = settledScreen === 10 && !compact && y >= (x >= .36 ? .54 : x >= .28 ? .57 : .60)
        assert.ok(!overContent || previewCorner || quotaBack || quotaCorner || conversationCorner || accountTuck || belowSettingsCopy,
          `settled cloth must leave copy and central preview clear at ${aspect}, ${at}, ${x}, ${y}`)
      }
      if (at >= .37 && row === scarfRows / 2 && column > first + 2 && column < scarfSegments - 1 && Math.abs(projected.x) < .99 && Math.abs(projected.y) < .99) {
        earlier.fromArray(travel, i - 3).project(camera)
        later.fromArray(travel, i + 3).project(camera)
        incoming.set(projected.x - earlier.x, projected.y - earlier.y)
        outgoing.set(later.x - projected.x, later.y - projected.y)
        assert.ok(incoming.length() < .09 && incoming.normalize().dot(outgoing.normalize()) > .32,
          `visible material must turn without gaps or sharp reversals at ${aspect}, ${at}, ${column}`)
        if (Math.abs(at % 1 - .8) < .001 && column >= first + 12 && column <= scarfSegments - 12) {
          earlier.fromArray(travel, i - 36).project(camera)
          later.fromArray(travel, i + 36).project(camera)
          incoming.set((projected.x - earlier.x) * aspect, projected.y - earlier.y).normalize()
          outgoing.set((later.x - projected.x) * aspect, later.y - projected.y).normalize()
          const settingsReturn = settledScreen === 10 && !compact && projected.x < -.2
          assert.ok(incoming.dot(outgoing) > (settingsReturn ? .4 : .65),
            `the resting drape must have a soft bend at ${aspect}, ${at}, ${column}`)
        }
      }
      if (frame > 0) {
        assert.ok(vertex.distanceTo(hitPoint.fromArray(folds[frame - 1], i)) < 1.05, `chapter progress must move the cloth continuously at ${aspect}, ${at}, ${row}, ${column}`)
      }
    }
    const runs = visible.reduce((count, value, column) => count + Number(value && !visible[column - 1]), 0)
    assert.equal(runs, 1, `the cloth must show one connected footprint at ${at} and aspect ${aspect}`)
    folds.push(travel.slice())
  }
  for (let frame = chapterFrames; frame >= 0; frame--) {
    stageStudioScarfChapters(travel, chapters, samples[frame])
    assert.deepEqual(travel, folds[frame], 'reverse scrolling must retrace the same fabric pose')
  }

  const returns = [folds[chapterFrames]]
  const returnFrames = 48
  for (let frame = 1; frame <= returnFrames; frame++) {
    const at = studioFinaleStart + (studioFinaleEnd - studioFinaleStart) * frame / returnFrames
    stageStudioScarfChapters(travel, chapters, at)
    for (let row = 0; row <= scarfRows; row++) {
      for (let column = first; column <= scarfSegments; column++) {
        const index = (row * cols + column) * 3
        vertex.fromArray(travel, index)
        assert.ok(vertex.distanceTo(hitPoint.fromArray(returns[frame - 1], index)) < 1, 'the returning scarf must stay continuous')
      }
    }
    returns.push(travel.slice())
  }
  for (let frame = returnFrames; frame >= 0; frame--) {
    stageStudioScarfChapters(travel, chapters, studioFinaleStart + (studioFinaleEnd - studioFinaleStart) * frame / returnFrames)
    assert.deepEqual(travel, returns[frame], 'the collar and fringe must return along the same route on reverse scroll')
  }
}

{
  const column = 102
  const gustRest = pose.positions.slice()
  for (let row = 0; row <= scarfRows; row++) for (let col = collarColumns + 1; col <= scarfSegments; col++) {
    gustRest[(row * cols + col) * 3 + 1] = studioDrapeFloor + (col >= 125 ? .45 : .03)
  }
  const cloth = createStudioScarfMotion(gustRest)
  const step = (quiet, immediate = false) => cloth.step(dt, .14, false, immediate, false, 1, studioMark, 1,
    { phase: studioScarfGustPhase(quiet, 10), column, edge: 1, floorHeight: studioDrapeFloor })
  step(2)
  assert.deepEqual(cloth.positions, gustRest, 'the fabric stays still before the gust')
  step(3.32)
  const hem = (scarfRows * cols + column) * 3 + 1
  assert.ok(cloth.positions[hem] - gustRest[hem] > .1, 'a short gust lifts the hem')
  assert.equal(cloth.positions[column * 3 + 1], gustRest[column * 3 + 1], 'the grounded edge stays down')
  const lift = col => cloth.positions[(centerRow + col) * 3 + 1] - gustRest[(centerRow + col) * 3 + 1]
  step(3.55)
  assert.ok(lift(145) > .25 && lift(145) - lift(190) > .09, 'the suspended body lifts before the traveling gust reaches the far end')
  step(3.85)
  assert.ok(lift(190) > .25 && lift(190) - lift(145) > .09, 'the pulse travels to the far end as the first fold settles')
  assert.equal(lift(65), 0, 'the breeze leaves the floor contact outside the local hem still')
  step(5)
  assert.deepEqual(cloth.positions, gustRest, 'the cloth comes back to rest after the gust')
  step(3.32, true)
  assert.deepEqual(cloth.positions, gustRest, 'reduced motion stays still during the gust')
}

{
  // The quota card used to cut the scarf as the reader scrolled out of the scene.
  const aspect = 1265 / 800, depth = studioQuotaCardDepth
  const camera = new PerspectiveCamera(studioFov, aspect, .1, 100)
  const { position, target, roll } = studioCameraPose(1, aspect)
  camera.position.copy(position)
  camera.up.set(Math.sin(roll), Math.cos(roll), 0)
  camera.lookAt(target); camera.updateMatrixWorld()
  const card = new Box2(new Vector2(-.9732, -2.1020), new Vector2(4.4359, 2.3450))
  const positions = makeStudioScarfPose(aspect).positions
  const landing = makeStudioScarfLanding(positions, aspect)
  stageStudioScarfChapters(positions, makeStudioScarfChapters(landing, aspect, false), 2.13)
  const a = new Vector3(), b = new Vector3(), p = new Vector2()
  function crossesCard() {
    for (let row = 0; row < scarfRows; row++) for (let column = studioCollarTrim(1); column < scarfSegments; column++) {
      const i = row * cols + column
      a.fromArray(positions, i * 3).applyMatrix4(camera.matrixWorldInverse)
      for (const next of [i + 1, i + cols, i + cols + 1]) {
        b.fromArray(positions, next * 3).applyMatrix4(camera.matrixWorldInverse)
        if ((a.z + depth) * (b.z + depth) >= 0) continue
        const t = (-depth - a.z) / (b.z - a.z)
        if (card.containsPoint(p.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t))) return true
      }
    }
    return false
  }
  assert.ok(crossesCard(), 'the quota exit fixture must reproduce the intersection before routing')
  clearStudioCardEdge(positions, camera, depth, card, new Float32Array(2 * cols))
  assert.ok(!crossesCard(), 'the scrolling scarf must route around the quota card edge')
}

const segments = 4, rows = 2, grid = new Float32Array((segments + 1) * (rows + 1) * 3)
for (let y = 0; y <= rows; y++) for (let x = 0; x <= segments; x++) grid.set([x, (y / rows - .5) * .72, Math.sin(x * .4) * .2], (y * (segments + 1) + x) * 3)
const shell = createScarfMesh(grid, segments, rows, material)
const geometry = shell.mesh.geometry, positions = geometry.attributes.position.array, normals = geometry.attributes.normal.array
assert.ok(positions.every(Number.isFinite) && normals.every(Number.isFinite))
for (let i = 0; i < normals.length; i += 3) assert.ok(Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) < 1e-5, 'shell normals must stay unit length')
const edgeCounts = new Map()
const key = index => Array.from(positions.slice(index * 3, index * 3 + 3)).map(n => n.toFixed(5)).join(',')
let volume = 0
const a = new Vector3(), b = new Vector3(), c = new Vector3()
for (let i = 0; i < geometry.index.count; i += 3) {
  const ids = [0, 1, 2].map(j => geometry.index.getX(i + j))
  a.fromArray(positions, ids[0] * 3); b.fromArray(positions, ids[1] * 3); c.fromArray(positions, ids[2] * 3)
  volume += a.dot(b.cross(c)) / 6
  for (let j = 0; j < 3; j++) {
    const edge = [key(ids[j]), key(ids[(j + 1) % 3])].sort().join('|')
    edgeCounts.set(edge, (edgeCounts.get(edge) ?? 0) + 1)
  }
}
assert.ok([...edgeCounts.values()].every(count => count === 2), 'shell must be closed, including its seam and ends')
assert.ok(volume > 0, 'shell triangle winding must face outward')
shell.mesh.updateMatrixWorld()
const hit = new Raycaster(new Vector3(2, 0, 10), new Vector3(0, 0, -1)).intersectObject(shell.mesh)[0]
assert.ok(hit && Math.abs(hit.uv.x - .5) < .001, 'shell picking must preserve the along-scarf UV')
const oldCenter = geometry.boundingSphere.center.z
for (let i = 2; i < grid.length; i += 3) grid[i] += .4
shell.update()
assert.equal(positions, geometry.attributes.position.array, 'shell deformation must reuse its position buffer')
assert.ok(Math.abs(geometry.boundingSphere.center.z - oldCenter - .4) < 1e-6, 'bounds must follow the deformed shell')
assert.ok(geometry.attributes.normal.array.every(Number.isFinite))
const fullShell = positions.slice()
shell.retractCollar(1.5)
shell.update()
assert.ok(Math.abs(positions[0] - 1.5) < .003, 'the closed end must retract continuously between columns')
const retractedHit = new Raycaster(new Vector3(2, 0, 10), new Vector3(0, 0, -1)).intersectObject(shell.mesh)[0]
assert.ok(retractedHit && Math.abs(retractedHit.uv.x - .5) < .001, 'retracting the collar must keep the grab coordinate on the same material')
shell.retractCollar(0)
shell.update()
assert.deepEqual(positions, fullShell, 'reverse scrolling must restore the full collar')
assert.throws(() => createScarfMesh(new Float32Array([NaN]), segments, rows, material), RangeError)
shell.dispose(); material.dispose()
console.log('Studio collar, drag/release, closed scarf shell, and continuous hero and chapter framing checks passed.')
