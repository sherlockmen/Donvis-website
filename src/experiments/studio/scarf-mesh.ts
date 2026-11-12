import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const random = (index: number) => THREE.MathUtils.euclideanModulo(Math.sin(index * 127.1 + 3) * 43758.5453, 1)

function createFringe(positions: Float32Array, cols: number, rows: number) {
  const plies = [0, Math.PI].map(phase => {
    const path = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => {
      const t = i / 11, twist = phase + t * 3.4 * Math.PI
      return new THREE.Vector3(.18 * t - .012, Math.cos(twist) * .009, Math.sin(twist) * .009 - .026 * t * t)
    }))
    const geometry = new THREE.TubeGeometry(path, 16, .0085, 5, false)
    const colors = new Float32Array(geometry.attributes.position.count * 3).fill(phase ? .76 : 1)
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geometry
  })
  const geometry = mergeGeometries(plies)
  for (const ply of plies) ply.dispose()
  const material = new THREE.MeshStandardMaterial({ color: '#ab261b', vertexColors: true, roughness: .99 })
  const knots = Array.from({ length: 10 }, (_, i) => {
    const across = .06 + .88 * i / 9
    return { across, length: .65 + random(i + 31) * .49, width: .73 + random(i + 71) * .29, splay: (across - .5) * .53 + (random(i + 91) - .5) * .18 }
  })
  const mesh = new THREE.InstancedMesh(geometry, material, knots.length)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.receiveShadow = true
  mesh.raycast = () => undefined
  const last = cols - 1
  const tangent = new THREE.Vector3(), across = new THREE.Vector3(), normal = new THREE.Vector3()
  const root = new THREE.Vector3(), point = new THREE.Vector3(), scale = new THREE.Vector3()
  const frame = new THREE.Matrix4(), rotation = new THREE.Matrix4(), instance = new THREE.Matrix4()

  function update() {
    const mid = Math.floor(rows / 2) * cols + last
    tangent.fromArray(positions, mid * 3).sub(point.fromArray(positions, (mid - 1) * 3)).normalize()
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0)
    across.fromArray(positions, (rows * cols + last) * 3).sub(point.fromArray(positions, last * 3)).normalize()
    normal.crossVectors(tangent, across).normalize()
    if (normal.lengthSq() < 1e-8) normal.set(0, 0, 1).addScaledVector(tangent, -tangent.z).normalize()
    if (normal.lengthSq() < 1e-8) normal.set(0, 1, 0)
    across.crossVectors(normal, tangent)
    frame.makeBasis(tangent, across, normal)
    for (const [index, knot] of knots.entries()) {
      const row = knot.across * rows, low = Math.floor(row)
      root.fromArray(positions, (low * cols + last) * 3)
        .lerp(point.fromArray(positions, ((low + 1) * cols + last) * 3), row - low)
      instance.copy(frame).multiply(rotation.makeRotationZ(knot.splay))
        .scale(scale.set(knot.length, knot.width, knot.width)).setPosition(root)
      mesh.setMatrixAt(index, instance)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  return { mesh, update }
}

/** A thin cloth shell; the supplied wool material remains owned by the caller. */
export function createScarfMesh(positions: Float32Array, segments: number, rows: number, material: THREE.Material) {
  const cols = segments + 1, count = cols * (rows + 1)
  if (!Number.isInteger(segments) || !Number.isInteger(rows) || segments < 1 || rows < 1 || positions.length !== count * 3 || !positions.every(Number.isFinite)) {
    throw new RangeError('Scarf requires a finite (segments + 1) × (rows + 1) grid.')
  }
  const boundary: number[] = []
  for (let x = 0; x <= segments; x++) boundary.push(x)
  for (let y = 1; y <= rows; y++) boundary.push(y * cols + segments)
  for (let x = segments - 1; x >= 0; x--) boundary.push(rows * cols + x)
  for (let y = rows - 1; y > 0; y--) boundary.push(y * cols)
  const perimeter = boundary.length, edgeStart = count * 2
  const vertices = new Float32Array((edgeStart + perimeter * 3) * 3)
  const trimmed = new Float32Array(positions.length)
  const normals = new Float32Array(vertices.length)
  const surfaceNormals = new Float32Array(count * 3)
  const uv = new Float32Array((edgeStart + perimeter * 3) * 2)
  const thickness = Float32Array.from({ length: count }, (_, i) => {
    const x = i % cols, y = Math.floor(i / cols)
    return (.0165 + .0015 * Math.sin(x * .42)) * (.8 + .2 * Math.sin(Math.PI * y / rows))
  })
  const indices: number[] = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < segments; x++) {
    const a = y * cols + x, b = a + 1, c = a + cols, d = c + 1
    indices.push(a, b, c, b, d, c)
    indices.push(a + count, c + count, b + count, b + count, c + count, d + count)
  }
  const surfaceIndices = indices.length
  for (let ring = 0; ring < 2; ring++) {
    for (let i = 0; i < perimeter; i++) {
      const a = edgeStart + ring * perimeter + i
      const b = edgeStart + ring * perimeter + (i + 1) % perimeter
      indices.push(a, a + perimeter, b, b, a + perimeter, b + perimeter)
    }
  }
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= segments; x++) {
    const i = y * cols + x
    uv[i * 2] = uv[(i + count) * 2] = x / segments
    uv[i * 2 + 1] = uv[(i + count) * 2 + 1] = y / rows
  }
  for (let i = 0; i < perimeter; i++) {
    const source = boundary[i]
    for (let ring = 0; ring < 3; ring++) {
      const target = edgeStart + i + ring * perimeter
      uv[target * 2] = source % cols / segments
      uv[target * 2 + 1] = Math.floor(source / cols) / rows
    }
  }
  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage)
  const normalAttribute = new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('normal', normalAttribute)
  const woolUv = new THREE.BufferAttribute(uv.slice(), 2)
  geometry.setAttribute('uv', woolUv)
  geometry.setIndex(indices)
  geometry.addGroup(0, surfaceIndices, 0)
  geometry.addGroup(surfaceIndices, indices.length - surfaceIndices, 1)
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#98271b', roughness: .98, metalness: 0 })
  const mesh = new THREE.Mesh(geometry, [material, edgeMaterial])
  mesh.frustumCulled = false
  mesh.castShadow = true

  const fibers: { edge: number; offset: number; length: number; bend: number; lean: number }[] = []
  for (let edge = 0; edge < 2 * segments + rows; edge++) {
    for (let layer = 0; layer < 2; layer++) {
      const seed = edge * 2 + layer
      if (random(seed) < (layer ? .48 : .1)) continue
      fibers.push({
        edge,
        offset: (layer + random(seed + perimeter)) / 2,
        length: .006 + random(seed + 2 * perimeter) * (layer ? .029 : .015),
        bend: (random(seed + 3 * perimeter) - .5) * 1.7,
        lean: (random(seed + 4 * perimeter) - .5) * 2.4,
      })
    }
  }
  const fiberGeometry = new THREE.BufferGeometry()
  const fiberPositions = new THREE.BufferAttribute(new Float32Array(fibers.length * 12), 3).setUsage(THREE.DynamicDrawUsage)
  const fiberNormals = new THREE.BufferAttribute(new Float32Array(fibers.length * 12), 3).setUsage(THREE.DynamicDrawUsage)
  fiberGeometry.setAttribute('position', fiberPositions)
  fiberGeometry.setAttribute('normal', fiberNormals)
  const fiberColors = new Float32Array(fibers.length * 16).fill(1)
  for (let i = 0; i < fibers.length; i++) {
    fiberColors[i * 16 + 3] = .25
    fiberColors[i * 16 + 15] = .04
  }
  fiberGeometry.setAttribute('color', new THREE.BufferAttribute(fiberColors, 4))
  const fiberMaterial = new THREE.LineBasicMaterial({ color: '#ee8160', vertexColors: true, transparent: true, opacity: .45, depthWrite: false })
  fiberMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float woolGrazing;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        float facing = abs(dot(normalize(normalMatrix * normal), normalize(-mvPosition.xyz)));
        woolGrazing = .16 + .84 * pow(1.0 - facing, 1.65);`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float woolGrazing;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= woolGrazing;')
  }
  const fuzz = new THREE.LineSegments(fiberGeometry, fiberMaterial)
  fuzz.frustumCulled = false
  fuzz.raycast = () => undefined
  const fringe = createFringe(positions, cols, rows)
  mesh.add(fuzz, fringe.mesh)
  const tangent = new THREE.Vector3(), outward = new THREE.Vector3(), normal = new THREE.Vector3()
  const root = new THREE.Vector3(), next = new THREE.Vector3(), bend = new THREE.Vector3(), tip = new THREE.Vector3()

  let trim = 0
  function update() {
    let cloth = positions
    if (trim > 0) {
      cloth = trimmed
      for (let x = 0; x <= segments; x++) {
        const source = THREE.MathUtils.lerp(trim, segments, x / segments)
        const low = Math.floor(source), high = Math.min(low + 1, segments)
        for (let y = 0; y <= rows; y++) for (let axis = 0; axis < 3; axis++) {
          const row = y * cols
          cloth[(row + x) * 3 + axis] = THREE.MathUtils.lerp(
            positions[(row + low) * 3 + axis], positions[(row + high) * 3 + axis], source - low,
          )
        }
      }
    }
    for (let y = 0; y <= rows; y++) for (let x = 0; x <= segments; x++) {
      const i = (y * cols + x) * 3
      const left = (y * cols + Math.max(0, x - 1)) * 3, right = (y * cols + Math.min(segments, x + 1)) * 3
      const below = (Math.max(0, y - 1) * cols + x) * 3, above = (Math.min(rows, y + 1) * cols + x) * 3
      const ax = cloth[right] - cloth[left], ay = cloth[right + 1] - cloth[left + 1], az = cloth[right + 2] - cloth[left + 2]
      const bx = cloth[above] - cloth[below], by = cloth[above + 1] - cloth[below + 1], bz = cloth[above + 2] - cloth[below + 2]
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx
      const length = Math.hypot(nx, ny, nz)
      if (length > 1e-8) {
        surfaceNormals[i] = nx / length; surfaceNormals[i + 1] = ny / length; surfaceNormals[i + 2] = nz / length
      } else if (!surfaceNormals[i] && !surfaceNormals[i + 1] && !surfaceNormals[i + 2]) surfaceNormals[i + 2] = 1
      const halfThickness = thickness[i / 3]
      for (let axis = 0; axis < 3; axis++) {
        const n = surfaceNormals[i + axis], p = cloth[i + axis]
        vertices[i + axis] = p + n * halfThickness
        vertices[count * 3 + i + axis] = p - n * halfThickness
        normals[i + axis] = n
        normals[count * 3 + i + axis] = -n
      }
    }
    // The middle ring rounds off the seam without bending the knitted faces or their UVs.
    for (let i = 0; i < perimeter; i++) {
      const source = boundary[i] * 3, target = (edgeStart + i) * 3
      const before = boundary[(i + perimeter - 1) % perimeter] * 3, after = boundary[(i + 1) % perimeter] * 3
      tangent.fromArray(cloth, after).sub(next.fromArray(cloth, before))
      normal.fromArray(surfaceNormals, source)
      outward.crossVectors(tangent, normal)
      if (outward.lengthSq() < 1e-12) {
        tangent.set(1, 0, 0)
        if (Math.abs(normal.x) > .9) tangent.set(0, 1, 0)
        outward.crossVectors(tangent, normal)
      }
      outward.normalize()
      const middle = target + perimeter * 3, back = middle + perimeter * 3
      const radius = thickness[source / 3] * .88
      for (let axis = 0; axis < 3; axis++) {
        vertices[target + axis] = vertices[source + axis]
        vertices[middle + axis] = cloth[source + axis] + outward.getComponent(axis) * radius
        vertices[back + axis] = vertices[count * 3 + source + axis]
        normals[target + axis] = surfaceNormals[source + axis]
        normals[middle + axis] = outward.getComponent(axis)
        normals[back + axis] = -surfaceNormals[source + axis]
      }
    }
    for (let i = 0; i < fibers.length; i++) {
      const fiber = fibers[i], following = (fiber.edge + 1) % perimeter
      const a = (edgeStart + perimeter + fiber.edge) * 3, b = (edgeStart + perimeter + following) * 3
      root.fromArray(vertices, a)
      next.fromArray(vertices, b)
      tangent.subVectors(next, root).normalize()
      root.lerp(next, fiber.offset)
      outward.fromArray(normals, a).lerp(next.fromArray(normals, b), fiber.offset).normalize()
      normal.fromArray(surfaceNormals, boundary[fiber.edge] * 3)
        .lerp(next.fromArray(surfaceNormals, boundary[following] * 3), fiber.offset).normalize()
      bend.copy(root).addScaledVector(outward, .66 * fiber.length).addScaledVector(tangent, fiber.lean * .28 * fiber.length)
      tip.copy(root).addScaledVector(outward, fiber.length).addScaledVector(tangent, fiber.lean * fiber.length)
        .addScaledVector(normal, fiber.bend * fiber.length)
      const index = i * 4
      fiberPositions.setXYZ(index, root.x, root.y, root.z)
      fiberPositions.setXYZ(index + 1, bend.x, bend.y, bend.z)
      fiberPositions.setXYZ(index + 2, bend.x, bend.y, bend.z)
      fiberPositions.setXYZ(index + 3, tip.x, tip.y, tip.z)
      for (let j = 0; j < 4; j++) fiberNormals.setXYZ(index + j, normal.x, normal.y, normal.z)
    }
    fiberPositions.needsUpdate = fiberNormals.needsUpdate = true
    fringe.update()
    positionAttribute.needsUpdate = normalAttribute.needsUpdate = true
    geometry.computeBoundingSphere()
  }
  update()
  function retractCollar(columns: number) {
    if (columns === trim) return
    trim = columns
    const start = trim / segments
    for (let i = 0; i < woolUv.count; i++) woolUv.setX(i, THREE.MathUtils.lerp(start, 1, uv[i * 2]))
    woolUv.needsUpdate = true
  }
  return { mesh, update, retractCollar, dispose() {
    geometry.dispose(); edgeMaterial.dispose(); fiberGeometry.dispose(); fiberMaterial.dispose()
    fringe.mesh.geometry.dispose(); fringe.mesh.material.dispose(); fringe.mesh.dispose()
  } }
}
