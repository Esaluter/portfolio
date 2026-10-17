import type { Node, XYPosition } from '@xyflow/react'

export const findFreePosition = (
  nodes: Pick<Node, 'position'>[]
): XYPosition => {
  const startX = 100
  const startY = 100

  const gapX = 300
  const gapY = 200

  const columns = 4

  for (
    let index = 0;
    index < 1000;
    index++
  ) {
    const column =
      index % columns

    const row =
      Math.floor(index / columns)

    const x =
      startX + column * gapX

    const y =
      startY + row * gapY

    const isOccupied =
      nodes.some((node) => {
        const distanceX =
          Math.abs(
            node.position.x - x
          )

        const distanceY =
          Math.abs(
            node.position.y - y
          )

        return (
          distanceX < 250 &&
          distanceY < 150
        )
      })

    if (!isOccupied) {
      return { x, y }
    }
  }

  return {
    x: startX,

    y:
      startY +
      nodes.length * gapY,
  }
}
