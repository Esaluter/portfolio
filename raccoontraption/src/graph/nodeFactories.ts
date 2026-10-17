import type { XYPosition } from '@xyflow/react'

import type {
  CompareNode,
  IndicatorNode,
  LogicNode,
  MathNode,
  NumberNode,
  OutputNode,
  RandomNode,
} from '../types'
import { createUniqueId } from './createUniqueId'

const evaluationState = {
  error: null,
  errorDetails: null,
}

export const createNumberNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): NumberNode => ({
  id: createUniqueId('number', existingIds),
  type: 'number',
  position,
  data: {
    value: 0,
    ...evaluationState,
  },
})

export const createMathNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): MathNode => ({
  id: createUniqueId('math', existingIds),
  type: 'math',
  position,
  data: {
    value: null,
    ...evaluationState,
    operation: 'add',
  },
})

export const createOutputNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): OutputNode => ({
  id: createUniqueId('output', existingIds),
  type: 'output',
  position,
  data: {
    value: null,
    ...evaluationState,
  },
})

export const createRandomNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): RandomNode => ({
  id: createUniqueId('random', existingIds),
  type: 'random',
  position,
  data: {
    min: 1,
    max: 100,
    value: null,
    ...evaluationState,
  },
})

export const createCompareNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): CompareNode => ({
  id: createUniqueId('compare', existingIds),
  type: 'compare',
  position,
  data: {
    value: null,
    operation: 'greater',
    ...evaluationState,
  },
})

export const createLogicNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): LogicNode => ({
  id: createUniqueId('logic', existingIds),
  type: 'logic',
  position,
  data: {
    value: null,
    operation: 'and',
    ...evaluationState,
  },
})

export const createIndicatorNode = (
  position: XYPosition,
  existingIds: Iterable<string> = [],
): IndicatorNode => ({
  id: createUniqueId('indicator', existingIds),
  type: 'indicator',
  position,
  data: {
    label: 'Индикатор',
    mode: 'auto',
    min: 0,
    max: 100,
    value: null,
    ...evaluationState,
  },
})
