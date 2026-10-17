import type { Edge, XYPosition } from '@xyflow/react'

import type {
  CompareOperation,
  ContraptionNode,
  IndicatorMode,
  LogicOperation,
  MathOperation,
} from '../types'

export const GRAPH_FORMAT = 'raccoontraption' as const
export const GRAPH_VERSION = 1 as const
export const MAX_FILE_SIZE_BYTES = 1_000_000
export const MAX_NODES = 1_000
export const MAX_EDGES = 5_000
export const MAX_COORDINATE = 1_000_000

type SavedNodeBase<Type extends string, Data> = {
  id: string
  type: Type
  position: XYPosition
  data: Data
}

export type SavedNode =
  | SavedNodeBase<'number', { value: number }>
  | SavedNodeBase<'math', { operation: MathOperation }>
  | SavedNodeBase<'random', { min: number; max: number }>
  | SavedNodeBase<'compare', { operation: CompareOperation }>
  | SavedNodeBase<'logic', { operation: LogicOperation }>
  | SavedNodeBase<
      'indicator',
      { label: string; mode: IndicatorMode; min: number; max: number }
    >
  | SavedNodeBase<'output', Record<string, never>>

export type SavedEdge = {
  id: string
  source: string
  target: string
  sourceHandle: string | null
  targetHandle: string | null
}

export type SavedGraphV1 = {
  format: typeof GRAPH_FORMAT
  version: typeof GRAPH_VERSION
  nodes: SavedNode[]
  edges: SavedEdge[]
}

export type RestoredGraph = {
  nodes: ContraptionNode[]
  edges: Edge[]
}

export type ImportErrorCode =
  | 'file-too-large'
  | 'invalid-json'
  | 'invalid-format'
  | 'unsupported-version'
  | 'invalid-structure'
  | 'too-many-items'
  | 'duplicate-id'
  | 'invalid-node'
  | 'invalid-edge'
  | 'invalid-connection'

export type ImportError = {
  code: ImportErrorCode
  message: string
}

export type ImportResult =
  | { ok: true; graph: RestoredGraph }
  | { ok: false; error: ImportError }

export type ValidationResult =
  | { ok: true; graph: SavedGraphV1 }
  | { ok: false; error: ImportError }
