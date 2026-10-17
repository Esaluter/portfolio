import type { Connection, Edge } from '@xyflow/react'

import type { ContraptionNode, GraphValue } from '../types'

export type ConnectionIssueCode =
  | 'missing-node'
  | 'invalid-direction'
  | 'invalid-handle'
  | 'type-mismatch'
  | 'duplicate'
  | 'input-occupied'

export type ConnectionIssue = {
  code: ConnectionIssueCode
  message: string
}

type ConnectionLike = Pick<Connection, 'source' | 'target'> & {
  sourceHandle?: string | null
  targetHandle?: string | null
}

type ValueType = 'number' | 'boolean'

const normalizeHandle = (
  handle: string | null | undefined,
): string | null => handle ?? null

const getSourceType = (
  node: ContraptionNode,
): ValueType | null => {
  switch (node.type) {
    case 'number':
    case 'math':
    case 'random':
      return 'number'
    case 'compare':
    case 'logic':
      return 'boolean'
    case 'output':
    case 'indicator':
      return null
  }
}

const getExpectedSourceHandle = (
  node: ContraptionNode,
): string | null => {
  switch (node.type) {
    case 'math':
    case 'compare':
    case 'logic':
      return 'result'
    default:
      return null
  }
}

const isSourceHandleValid = (
  node: ContraptionNode,
  handle: string | null,
): boolean => {
  const expected = getExpectedSourceHandle(node)
  return handle === null || handle === expected
}

const getTargetType = (
  node: ContraptionNode,
  handle: string | null,
): ValueType | 'supported' | null => {
  switch (node.type) {
    case 'math':
      return handle === null || handle === 'input'
        ? 'number'
        : null
    case 'compare':
      return handle === 'a' || handle === 'b'
        ? 'number'
        : null
    case 'logic':
      if (handle === 'a') {
        return 'boolean'
      }

      return handle === 'b' && node.data.operation !== 'not'
        ? 'boolean'
        : null
    case 'output':
      return handle === null ? 'supported' : null
    case 'indicator':
      return handle === 'value' ? 'supported' : null
    case 'number':
    case 'random':
      return null
  }
}

export const getConnectionIssue = (
  connection: ConnectionLike,
  nodes: readonly ContraptionNode[],
  edges: readonly Edge[],
): ConnectionIssue | null => {
  const sourceNode = nodes.find(
    (node) => node.id === connection.source,
  )
  const targetNode = nodes.find(
    (node) => node.id === connection.target,
  )

  if (!sourceNode || !targetNode) {
    return {
      code: 'missing-node',
      message: 'Связь указывает на несуществующий блок',
    }
  }

  const sourceType = getSourceType(sourceNode)

  if (!sourceType) {
    return {
      code: 'invalid-direction',
      message: 'У исходного блока нет выхода',
    }
  }

  const sourceHandle = normalizeHandle(connection.sourceHandle)

  if (!isSourceHandleValid(sourceNode, sourceHandle)) {
    return {
      code: 'invalid-handle',
      message: 'У исходного блока нет такого выхода',
    }
  }

  const targetHandle = normalizeHandle(connection.targetHandle)
  const targetType = getTargetType(targetNode, targetHandle)

  if (!targetType) {
    return {
      code: 'invalid-handle',
      message: 'У целевого блока нет такого входа',
    }
  }

  if (targetType !== 'supported' && targetType !== sourceType) {
    return {
      code: 'type-mismatch',
      message: `Вход ожидает ${targetType}, получено ${sourceType}`,
    }
  }

  const duplicate = edges.some((edge) =>
    edge.source === connection.source &&
    edge.target === connection.target &&
    normalizeHandle(edge.sourceHandle) === sourceHandle &&
    normalizeHandle(edge.targetHandle) === targetHandle,
  )

  if (duplicate) {
    return {
      code: 'duplicate',
      message: 'Такая связь уже существует',
    }
  }

  const inputOccupied = edges.some((edge) => {
    if (edge.target !== connection.target) {
      return false
    }

    if (targetNode.type === 'output' || targetNode.type === 'indicator') {
      return true
    }

    if (targetNode.type === 'compare' || targetNode.type === 'logic') {
      return normalizeHandle(edge.targetHandle) === targetHandle
    }

    return false
  })

  if (inputOccupied) {
    return {
      code: 'input-occupied',
      message: 'Этот вход уже подключён',
    }
  }

  return null
}

export const isConnectionAllowed = (
  connection: ConnectionLike,
  nodes: readonly ContraptionNode[],
  edges: readonly Edge[],
): boolean => getConnectionIssue(connection, nodes, edges) === null

export const isGraphValue = (value: unknown): value is GraphValue =>
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value))
