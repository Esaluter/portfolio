import type { Edge } from '@xyflow/react'

import { getConnectionIssue } from '../engine/connectionRules'
import type { ContraptionNode } from '../types'
import {
  GRAPH_FORMAT,
  GRAPH_VERSION,
  MAX_COORDINATE,
  MAX_EDGES,
  MAX_NODES,
  type ImportError,
  type SavedEdge,
  type SavedGraphV1,
  type SavedNode,
  type ValidationResult,
} from './types'

const mathOperations = new Set(['add', 'subtract', 'multiply', 'divide'])
const compareOperations = new Set([
  'greater',
  'less',
  'greater-or-equal',
  'less-or-equal',
  'equal',
  'not-equal',
])
const logicOperations = new Set(['and', 'or', 'not', 'xor'])
const indicatorModes = new Set(['auto', 'status', 'gauge'])

const fail = (code: ImportError['code'], message: string): ValidationResult => ({
  ok: false,
  error: { code, message },
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

const isSafeId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 200

const isFiniteCoordinate = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  Math.abs(value) <= MAX_COORDINATE

const validatePosition = (value: unknown): value is { x: number; y: number } =>
  isRecord(value) &&
  hasOnlyKeys(value, ['x', 'y']) &&
  isFiniteCoordinate(value.x) &&
  isFiniteCoordinate(value.y)

const validateNode = (value: unknown): value is SavedNode => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['id', 'type', 'position', 'data']) ||
    !isSafeId(value.id) ||
    !validatePosition(value.position) ||
    !isRecord(value.data)
  ) {
    return false
  }

  switch (value.type) {
    case 'number':
      return hasOnlyKeys(value.data, ['value']) &&
        typeof value.data.value === 'number' &&
        Number.isFinite(value.data.value)
    case 'math':
      return hasOnlyKeys(value.data, ['operation']) &&
        typeof value.data.operation === 'string' &&
        mathOperations.has(value.data.operation)
    case 'random':
      return hasOnlyKeys(value.data, ['min', 'max']) &&
        typeof value.data.min === 'number' &&
        typeof value.data.max === 'number' &&
        Number.isFinite(value.data.min) &&
        Number.isFinite(value.data.max) &&
        Number.isInteger(value.data.min) &&
        Number.isInteger(value.data.max) &&
        value.data.min <= value.data.max
    case 'compare':
      return hasOnlyKeys(value.data, ['operation']) &&
        typeof value.data.operation === 'string' &&
        compareOperations.has(value.data.operation)
    case 'logic':
      return hasOnlyKeys(value.data, ['operation']) &&
        typeof value.data.operation === 'string' &&
        logicOperations.has(value.data.operation)
    case 'indicator':
      return hasOnlyKeys(value.data, ['label', 'mode', 'min', 'max']) &&
        typeof value.data.label === 'string' &&
        value.data.label.length <= 60 &&
        typeof value.data.mode === 'string' &&
        indicatorModes.has(value.data.mode) &&
        typeof value.data.min === 'number' &&
        typeof value.data.max === 'number' &&
        Number.isFinite(value.data.min) &&
        Number.isFinite(value.data.max) &&
        value.data.min < value.data.max
    case 'output':
      return hasOnlyKeys(value.data, [])
    default:
      return false
  }
}

const isHandle = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === 'string' && value.length > 0 && value.length <= 100)

const validateEdge = (value: unknown): value is SavedEdge =>
  isRecord(value) &&
  hasOnlyKeys(
    value,
    ['id', 'source', 'target', 'sourceHandle', 'targetHandle'],
  ) &&
  isSafeId(value.id) &&
  isSafeId(value.source) &&
  isSafeId(value.target) &&
  isHandle(value.sourceHandle) &&
  isHandle(value.targetHandle)

const createValidationNode = (node: SavedNode): ContraptionNode => {
  const base = { id: node.id, type: node.type, position: { ...node.position } }
  const evaluationState = { error: null, errorDetails: null }

  switch (node.type) {
    case 'number':
      return { ...base, type: 'number', data: { ...node.data, ...evaluationState } }
    case 'math':
      return {
        ...base,
        type: 'math',
        data: { ...node.data, value: null, ...evaluationState },
      }
    case 'random':
      return {
        ...base,
        type: 'random',
        data: { ...node.data, value: null, ...evaluationState },
      }
    case 'compare':
      return {
        ...base,
        type: 'compare',
        data: { ...node.data, value: null, ...evaluationState },
      }
    case 'logic':
      return {
        ...base,
        type: 'logic',
        data: { ...node.data, value: null, ...evaluationState },
      }
    case 'indicator':
      return {
        ...base,
        type: 'indicator',
        data: { ...node.data, value: null, ...evaluationState },
      }
    case 'output':
      return {
        ...base,
        type: 'output',
        data: { value: null, ...evaluationState },
      }
  }
}

const hasCanonicalHandles = (
  edge: SavedEdge,
  nodes: readonly SavedNode[],
): boolean => {
  const source = nodes.find((node) => node.id === edge.source)
  const target = nodes.find((node) => node.id === edge.target)

  if (!source || !target) {
    return false
  }

  const expectedSourceHandle =
    source.type === 'math' || source.type === 'compare' || source.type === 'logic'
      ? 'result'
      : null
  const validTargetHandle = (() => {
    switch (target.type) {
      case 'math':
        return edge.targetHandle === 'input'
      case 'compare':
        return edge.targetHandle === 'a' || edge.targetHandle === 'b'
      case 'logic':
        return edge.targetHandle === 'a' ||
          (edge.targetHandle === 'b' && target.data.operation !== 'not')
      case 'output':
        return edge.targetHandle === null
      case 'indicator':
        return edge.targetHandle === 'value'
      case 'number':
      case 'random':
        return false
    }
  })()

  return edge.sourceHandle === expectedSourceHandle && validTargetHandle
}

export const validateGraph = (value: unknown): ValidationResult => {
  if (!isRecord(value)) {
    return fail('invalid-structure', 'Корневой элемент должен быть объектом')
  }

  if (value.format !== GRAPH_FORMAT) {
    return fail('invalid-format', '📦 В коробке оказался не тот проект.')
  }

  if (value.version !== GRAPH_VERSION) {
    return fail(
      'unsupported-version',
      '🦝 Этот чертёж из будущего. Версия пока не поддерживается.',
    )
  }

  if (
    !hasOnlyKeys(value, ['format', 'version', 'nodes', 'edges']) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges)
  ) {
    return fail(
      'invalid-structure',
      '🦝 В чертеже отсутствуют обязательные разделы nodes и edges.',
    )
  }

  if (value.nodes.length > MAX_NODES || value.edges.length > MAX_EDGES) {
    return fail(
      'too-many-items',
      `🦝 Чертёж слишком велик: максимум ${MAX_NODES} блоков и ${MAX_EDGES} связей.`,
    )
  }

  const nodes: SavedNode[] = []
  const nodeIds = new Set<string>()

  for (const [index, node] of value.nodes.entries()) {
    if (!validateNode(node)) {
      return fail('invalid-node', `🦝 Некорректный блок в позиции ${index + 1}.`)
    }

    if (nodeIds.has(node.id)) {
      return fail('duplicate-id', `🦝 Повторяется ID блока «${node.id}».`)
    }

    nodeIds.add(node.id)
    nodes.push(node)
  }

  const edges: SavedEdge[] = []
  const edgeIds = new Set<string>()
  const runtimeNodes = nodes.map(createValidationNode)
  const acceptedEdges: Edge[] = []

  for (const [index, edge] of value.edges.entries()) {
    if (!validateEdge(edge)) {
      return fail('invalid-edge', `🦝 Некорректная связь в позиции ${index + 1}.`)
    }

    if (edgeIds.has(edge.id)) {
      return fail('duplicate-id', `🦝 Повторяется ID связи «${edge.id}».`)
    }

    edgeIds.add(edge.id)

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return fail(
        'invalid-edge',
        `🦝 Связь «${edge.id}» указывает на отсутствующий блок.`,
      )
    }

    if (!hasCanonicalHandles(edge, nodes)) {
      return fail(
        'invalid-connection',
        `⛏️ У связи «${edge.id}» указан неподходящий порт.`,
      )
    }

    const issue = getConnectionIssue(edge, runtimeNodes, acceptedEdges)

    if (issue) {
      return fail(
        'invalid-connection',
        `⛏️ Связь «${edge.id}» не подходит: ${issue.message}.`,
      )
    }

    edges.push(edge)
    acceptedEdges.push({ ...edge })
  }

  const graph: SavedGraphV1 = {
    format: GRAPH_FORMAT,
    version: GRAPH_VERSION,
    nodes,
    edges,
  }

  return { ok: true, graph }
}
