import type { Edge } from '@xyflow/react'

import type { ContraptionNode } from '../types'
import { deserializeGraph } from '../persistence/deserializeGraph'
import type { ImportError, RestoredGraph } from '../persistence/types'
import type { DemoExample } from './demoGraphs'

export type ExampleLoadResult =
  | {
      ok: true
      graph: RestoredGraph
      previous: RestoredGraph
    }
  | { ok: false; error: ImportError }

export const prepareExampleLoad = (
  example: DemoExample,
  current: {
    nodes: readonly ContraptionNode[]
    edges: readonly Edge[]
  },
): ExampleLoadResult => {
  const result = deserializeGraph(JSON.stringify(example.graph))

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    graph: result.graph,
    previous: {
      nodes: structuredClone(current.nodes) as ContraptionNode[],
      edges: structuredClone(current.edges) as Edge[],
    },
  }
}
