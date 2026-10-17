import type { Edge } from '@xyflow/react'

import type { ContraptionNode } from '../types'
import {
  GRAPH_FORMAT,
  GRAPH_VERSION,
  type SavedGraphV1,
  type SavedNode,
} from './types'

const serializeNode = (node: ContraptionNode): SavedNode => {
  const base = {
    id: node.id,
    position: {
      x: node.position.x,
      y: node.position.y,
    },
  }

  switch (node.type) {
    case 'number':
      return { ...base, type: 'number', data: { value: node.data.value } }
    case 'math':
      return { ...base, type: 'math', data: { operation: node.data.operation } }
    case 'random':
      return {
        ...base,
        type: 'random',
        data: { min: node.data.min, max: node.data.max },
      }
    case 'compare':
      return {
        ...base,
        type: 'compare',
        data: { operation: node.data.operation },
      }
    case 'logic':
      return {
        ...base,
        type: 'logic',
        data: { operation: node.data.operation },
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
        },
      }
    case 'output':
      return { ...base, type: 'output', data: {} }
  }
}

export const serializeGraph = (
  nodes: readonly ContraptionNode[],
  edges: readonly Edge[],
): SavedGraphV1 => ({
  format: GRAPH_FORMAT,
  version: GRAPH_VERSION,
  nodes: nodes.map(serializeNode),
  edges: edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  })),
})

export const serializeGraphToJson = (
  nodes: readonly ContraptionNode[],
  edges: readonly Edge[],
): string => JSON.stringify(serializeGraph(nodes, edges), null, 2)
