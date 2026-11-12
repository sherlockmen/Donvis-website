// Shared by the native-window redraw and campaign; pixels come only from the supplied demo SVG.
export async function demoSharePNG(card: SVGSVGElement): Promise<Blob> {
  const svg = new XMLSerializer().serializeToString(card)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const picture = new Image()
    picture.src = url
    await picture.decode()
    const bitmap = document.createElement('canvas')
    bitmap.width = 1320; bitmap.height = 800
    const context = bitmap.getContext('2d')
    if (!context) throw new Error('无法生成图片')
    context.drawImage(picture, 0, 0, 1320, 800)
    return await new Promise<Blob>((resolve, reject) => bitmap.toBlob(blob => blob ? resolve(blob) : reject(new Error('无法生成 PNG')), 'image/png'))
  } finally { URL.revokeObjectURL(url) }
}
