import type { ContraptionNode } from '../types'
import {
  MAX_FILE_SIZE_BYTES,
  type ImportResult,
  type SavedNode,
} from './types'
import { validateGraph } from './validateGraph'

const restoreNode = (node: SavedNode): ContraptionNode => {
  const base = {
    id: node.id,
    position: { ...node.position },
  }
  const evaluationState = { error: null, errorDetails: null }

  switch (node.type) {
    case 'number':
      return {
        ...base,
        type: 'number',
        data: { value: node.data.value, ...evaluationState },
      }
    case 'math':
      return {
        ...base,
        type: 'math',
        data: { operation: node.data.operation, value: null, ...evaluationState },
      }
    case 'random':
      return {
        ...base,
        type: 'random',
        data: { min: node.data.min, max: node.data.max, value: null, ...evaluationState },
      }
    case 'compare':
      return {
        ...base,
        type: 'compare',
        data: { operation: node.data.operation, value: null, ...evaluationState },
      }
    case 'logic':
      return {
        ...base,
        type: 'logic',
        data: { operation: node.data.operation, value: null, ...evaluationState },
      }
    case 'indicator':
      return {
        ...base,
        type: 'indicator',
        data: {
          label: node.data.label,
          mode: node.data.mode,
          min: node.data.min,
          max: node.data.max,
          value: null,
          ...evaluationState,
        },
      }
    case 'output':
      return {
        ...base,
        type: 'output',
        data: { value: null, ...evaluationState },
      }
  }
}

export const deserializeGraph = (json: string): ImportResult => {
  if (new TextEncoder().encode(json).byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'file-too-large',
        message: `🦝 Файл слишком велик. Максимум ${MAX_FILE_SIZE_BYTES} байт.`,
      },
    }
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(json) as unknown
  } catch {
    return {
      ok: false,
      error: {
        code: 'invalid-json',
        message: '🦝 Енот не смог разобрать чертёж: JSON повреждён.',
      },
    }
  }

  const validation = validateGraph(parsed)

  if (!validation.ok) {
    return validation
  }

  return {
    ok: true,
    graph: {
      nodes: validation.graph.nodes.map(restoreNode),
      edges: validation.graph.edges.map((edge) => ({ ...edge })),
    },
  }
}
