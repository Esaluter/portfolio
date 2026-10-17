import type { Node } from '@xyflow/react'

export type GraphValue = number | boolean

export type MathOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'

export type CompareOperation =
  | 'greater'
  | 'less'
  | 'greater-or-equal'
  | 'less-or-equal'
  | 'equal'
  | 'not-equal'

export type LogicOperation =
  | 'and'
  | 'or'
  | 'not'
  | 'xor'

export type IndicatorMode =
  | 'auto'
  | 'status'
  | 'gauge'

type EvaluationDisplayData = {
  error: string | null
  errorDetails: string | null
}

export type NumberNodeData = EvaluationDisplayData & {
  value: number
  onChange?: (id: string, value: number) => void
}

export type MathNodeData = EvaluationDisplayData & {
  value: number | null
  operation: MathOperation
  onOperationChange?: (
    id: string,
    operation: MathOperation
  ) => void
}

export type RandomNodeData = EvaluationDisplayData & {
  min: number
  max: number
  value: number | null
  onRangeChange?: (
    id: string,
    min: number,
    max: number,
  ) => void
}

export type CompareNodeData = EvaluationDisplayData & {
  value: boolean | null
  operation: CompareOperation
  onOperationChange?: (
    id: string,
    operation: CompareOperation,
  ) => void
}

export type LogicNodeData = EvaluationDisplayData & {
  value: boolean | null
  operation: LogicOperation
  onOperationChange?: (
    id: string,
    operation: LogicOperation,
  ) => void
}

export type OutputNodeData = EvaluationDisplayData & {
  value: GraphValue | null
}

export type IndicatorSettings = {
  label: string
  mode: IndicatorMode
  min: number
  max: number
}

export type IndicatorNodeData = EvaluationDisplayData & IndicatorSettings & {
  value: GraphValue | null
  onSettingsChange?: (
    id: string,
    settings: IndicatorSettings,
  ) => void
}

export type NumberNode = Node<
  NumberNodeData,
  'number'
>

export type MathNode = Node<
  MathNodeData,
  'math'
>

export type OutputNode = Node<
  OutputNodeData,
  'output'
>

export type RandomNode = Node<
  RandomNodeData,
  'random'
>

export type CompareNode = Node<
  CompareNodeData,
  'compare'
>

export type LogicNode = Node<
  LogicNodeData,
  'logic'
>

export type IndicatorNode = Node<
  IndicatorNodeData,
  'indicator'
>

export type ContraptionNode =
  | NumberNode
  | MathNode
  | OutputNode
  | RandomNode
  | CompareNode
  | LogicNode
  | IndicatorNode
