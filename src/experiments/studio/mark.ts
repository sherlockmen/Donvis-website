import { DoubleSide, Group, Mesh, MeshBasicMaterial, ShapeGeometry } from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { studioFarEar, studioHeadSilhouette, studioNearEar } from '../../components/donvisOutline.ts'

export const markImageSize = 1254
export const markWorldSize = 4
export const markFaceDepth = .085

/** Share the picture's silhouette with the WebGL depth pass so the cloth can pass in front or behind. */
export function createMarkOccluder() {
  const group = new Group()
  const unit = markWorldSize / markImageSize
  group.scale.set(unit, -unit, 1)
  const paths = [studioHeadSilhouette, studioNearEar, studioFarEar]
  const svg = '<svg xmlns="http://www.w3.org/2000/svg">' + paths.map(path => `<path d="${path}"/>`).join('') + '</svg>'
  const material = new MeshBasicMaterial({ colorWrite: false, side: DoubleSide })
  for (const path of new SVGLoader().parse(svg).paths) {
    const geometry = new ShapeGeometry(path.toShapes(), 24)
    geometry.translate(-markImageSize / 2, -markImageSize / 2, 0)
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = -1
    mesh.castShadow = true
    group.add(mesh)
  }
  return group
}
