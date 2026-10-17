let sequence = 0

export const createUniqueId = (
  prefix: string,
  existingIds: Iterable<string> = [],
): string => {
  const occupied = new Set(existingIds)
  let id: string

  do {
    sequence += 1
    id = `${prefix}-${Date.now()}-${sequence}`
  } while (occupied.has(id))

  return id
}
