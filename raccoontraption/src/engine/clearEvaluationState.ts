import type { ContraptionNode } from '../types'

export const clearEvaluationState = (
  nodes: readonly ContraptionNode[],
): ContraptionNode[] => nodes.map((node) => ({
  ...node,
  data: {
    ...node.data,
    ...(node.type === 'number' ? {} : { value: null }),
    error: null,
    errorDetails: null,
  },
} as ContraptionNode))
