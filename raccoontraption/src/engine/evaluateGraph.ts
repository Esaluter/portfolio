import type { Edge } from '@xyflow/react'

import type {
  CompareNode,
  ContraptionNode,
  GraphValue,
  LogicNode,
} from '../types'
import { getConnectionIssue, isGraphValue } from './connectionRules'

export type EvaluationErrorCode =
  | 'cycle'
  | 'division-by-zero'
  | 'invalid-number'
  | 'dependency-error'
  | 'input-unavailable'
  | 'type-mismatch'
  | 'invalid-random-range'
  | 'invalid-indicator-range'
  | 'indicator-mode-mismatch'
  | 'invalid-connection'

export type EvaluationError = {
  nodeId: string
  code: EvaluationErrorCode
  message: string
}

export type EvaluationResult = {
  values: Record<string, GraphValue | null>
  errors: Record<string, EvaluationError>
}

export type EvaluationOptions = {
  random?: () => number
}

type NodeOutcome =
  | { status: 'success'; value: GraphValue }
  | { status: 'empty' }
  | { status: 'error' }

type NamedInputs = Record<string, NodeOutcome | undefined>

const compareValues = (
  node: CompareNode,
  a: number,
  b: number,
): boolean => {
  switch (node.data.operation) {
    case 'greater':
      return a > b
    case 'less':
      return a < b
    case 'greater-or-equal':
      return a >= b
    case 'less-or-equal':
      return a <= b
    case 'equal':
      return a === b
    case 'not-equal':
      return a !== b
  }
}

const applyLogic = (
  node: LogicNode,
  a: boolean,
  b?: boolean,
): boolean => {
  switch (node.data.operation) {
    case 'and':
      return a && b === true
    case 'or':
      return a || b === true
    case 'not':
      return !a
    case 'xor':
      return a !== b
  }
}

export const evaluateGraph = (
  nodes: readonly ContraptionNode[],
  edges: readonly Edge[],
  options: EvaluationOptions = {},
): EvaluationResult => {
  const random = options.random ?? Math.random
  const nodesById = new Map(
    nodes.map((node) => [node.id, node]),
  )
  const validEdges: Edge[] = []
  const invalidTargets = new Map<
    string,
    { code: EvaluationErrorCode; message: string }
  >()

  edges.forEach((edge) => {
    const issue = getConnectionIssue(edge, nodes, validEdges)

    if (!issue) {
      validEdges.push(edge)
      return
    }

    if (nodesById.has(edge.target) && !invalidTargets.has(edge.target)) {
      invalidTargets.set(edge.target, {
        code: issue.code === 'type-mismatch'
          ? 'type-mismatch'
          : 'invalid-connection',
        message: issue.message,
      })
    }
  })

  const incomingEdges = new Map<string, Edge[]>()

  validEdges.forEach((edge) => {
    const current = incomingEdges.get(edge.target) ?? []
    current.push(edge)
    incomingEdges.set(edge.target, current)
  })

  const outcomes = new Map<string, NodeOutcome>()
  const visitState = new Map<string, 'visiting' | 'done'>()
  const activePath: string[] = []
  const errors: Record<string, EvaluationError> = {}

  const setError = (
    nodeId: string,
    code: EvaluationErrorCode,
    message: string,
  ): NodeOutcome => {
    if (!errors[nodeId] || code === 'cycle') {
      errors[nodeId] = { nodeId, code, message }
    }

    return { status: 'error' }
  }

  const finish = (
    nodeId: string,
    outcome: NodeOutcome,
  ): NodeOutcome => {
    if (activePath.at(-1) === nodeId) {
      activePath.pop()
    }

    visitState.set(nodeId, 'done')
    outcomes.set(nodeId, outcome)
    return outcome
  }

  const evaluateNode = (nodeId: string): NodeOutcome => {
    const cached = outcomes.get(nodeId)

    if (cached) {
      return cached
    }

    if (visitState.get(nodeId) === 'visiting') {
      const cycleStart = activePath.indexOf(nodeId)
      const cycleNodeIds = activePath.slice(cycleStart)

      cycleNodeIds.forEach((cycleNodeId) => {
        setError(
          cycleNodeId,
          'cycle',
          'Обнаружена циклическая зависимость',
        )
      })

      return { status: 'error' }
    }

    const node = nodesById.get(nodeId)

    if (!node) {
      return { status: 'error' }
    }

    visitState.set(nodeId, 'visiting')
    activePath.push(nodeId)

    const invalidConnection = invalidTargets.get(nodeId)

    if (invalidConnection) {
      return finish(
        nodeId,
        setError(
          nodeId,
          invalidConnection.code,
          invalidConnection.message,
        ),
      )
    }

    if (node.type === 'number') {
      const value = Number(node.data.value)

      if (!Number.isFinite(value)) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'invalid-number',
            'Значение Number не является конечным числом',
          ),
        )
      }

      return finish(nodeId, { status: 'success', value })
    }

    if (node.type === 'random') {
      const { min, max } = node.data

      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        !Number.isInteger(min) ||
        !Number.isInteger(max) ||
        min > max
      ) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'invalid-random-range',
            'Random требует целые конечные Min ≤ Max',
          ),
        )
      }

      const randomValue = random()

      if (
        !Number.isFinite(randomValue) ||
        randomValue < 0 ||
        randomValue >= 1
      ) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'invalid-number',
            'Источник случайности должен вернуть число от 0 до 1',
          ),
        )
      }

      const value = Math.floor(
        randomValue * (max - min + 1),
      ) + min

      return finish(nodeId, { status: 'success', value })
    }

    const nodeIncomingEdges = incomingEdges.get(nodeId) ?? []

    if (node.type === 'indicator') {
      if (nodeIncomingEdges.length === 0) {
        return finish(nodeId, { status: 'empty' })
      }

      const sourceOutcome = evaluateNode(nodeIncomingEdges[0].source)

      if (sourceOutcome.status === 'error') {
        return finish(
          nodeId,
          setError(
            nodeId,
            'dependency-error',
            'Источник Indicator завершился ошибкой',
          ),
        )
      }

      if (sourceOutcome.status === 'empty') {
        return finish(nodeId, { status: 'empty' })
      }

      if (
        (node.data.mode === 'status' && typeof sourceOutcome.value !== 'boolean') ||
        (node.data.mode === 'gauge' && typeof sourceOutcome.value !== 'number')
      ) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'indicator-mode-mismatch',
            `Режим ${node.data.mode.toUpperCase()} несовместим со значением ${typeof sourceOutcome.value}`,
          ),
        )
      }

      const usesGauge = node.data.mode === 'gauge' ||
        (node.data.mode === 'auto' && typeof sourceOutcome.value === 'number')

      if (
        usesGauge &&
        (
          !Number.isFinite(node.data.min) ||
          !Number.isFinite(node.data.max) ||
          node.data.min >= node.data.max
        )
      ) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'invalid-indicator-range',
            'Indicator требует конечный диапазон Min < Max',
          ),
        )
      }

      return finish(nodeId, sourceOutcome)
    }

    if (node.type === 'output') {
      if (nodeIncomingEdges.length === 0) {
        return finish(nodeId, { status: 'empty' })
      }

      const sourceOutcome = evaluateNode(nodeIncomingEdges[0].source)

      if (sourceOutcome.status === 'error') {
        return finish(
          nodeId,
          setError(
            nodeId,
            'dependency-error',
            'Источник Output завершился ошибкой',
          ),
        )
      }

      if (sourceOutcome.status === 'empty') {
        return finish(
          nodeId,
          setError(
            nodeId,
            'input-unavailable',
            'Источник Output не содержит значения',
          ),
        )
      }

      return finish(nodeId, sourceOutcome)
    }

    if (node.type === 'math') {
      if (nodeIncomingEdges.length === 0) {
        return finish(nodeId, { status: 'empty' })
      }

      const inputValues: number[] = []

      for (const edge of nodeIncomingEdges) {
        const sourceOutcome = evaluateNode(edge.source)

        if (errors[nodeId]?.code === 'cycle') {
          return finish(nodeId, { status: 'error' })
        }

        if (sourceOutcome.status === 'error') {
          return finish(
            nodeId,
            setError(
              nodeId,
              'dependency-error',
              'Один из входов Math завершился ошибкой',
            ),
          )
        }

        if (sourceOutcome.status === 'empty') {
          return finish(
            nodeId,
            setError(
              nodeId,
              'input-unavailable',
              'Один из входов Math не содержит значения',
            ),
          )
        }

        if (typeof sourceOutcome.value !== 'number') {
          return finish(
            nodeId,
            setError(
              nodeId,
              'type-mismatch',
              'Math принимает только числа',
            ),
          )
        }

        inputValues.push(sourceOutcome.value)
      }

      let value: number

      switch (node.data.operation) {
        case 'subtract':
          value = inputValues
            .slice(1)
            .reduce((total, input) => total - input, inputValues[0])
          break
        case 'multiply':
          value = inputValues.reduce(
            (total, input) => total * input,
            1,
          )
          break
        case 'divide':
          if (inputValues.slice(1).some((input) => input === 0)) {
            return finish(
              nodeId,
              setError(
                nodeId,
                'division-by-zero',
                'Один из делителей равен нулю',
              ),
            )
          }

          value = inputValues
            .slice(1)
            .reduce((total, input) => total / input, inputValues[0])
          break
        case 'add':
        default:
          value = inputValues.reduce(
            (total, input) => total + input,
            0,
          )
          break
      }

      if (!Number.isFinite(value)) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'invalid-number',
            'Результат Math не является конечным числом',
          ),
        )
      }

      return finish(nodeId, { status: 'success', value })
    }

    const outcomesByHandle: NamedInputs = {}

    for (const edge of nodeIncomingEdges) {
      const handle = edge.targetHandle ?? ''
      outcomesByHandle[handle] = evaluateNode(edge.source)
    }

    if (errors[nodeId]?.code === 'cycle') {
      return finish(nodeId, { status: 'error' })
    }

    const requiredHandles = node.type === 'logic' && node.data.operation === 'not'
      ? ['a']
      : ['a', 'b']
    const requiredOutcomes = requiredHandles.map(
      (handle) => outcomesByHandle[handle],
    )

    if (requiredOutcomes.some((outcome) => outcome?.status === 'error')) {
      return finish(
        nodeId,
        setError(
          nodeId,
          'dependency-error',
          'Один из обязательных входов завершился ошибкой',
        ),
      )
    }

    if (
      requiredOutcomes.some(
        (outcome) => !outcome || outcome.status === 'empty',
      )
    ) {
      return finish(nodeId, { status: 'empty' })
    }

    const values = requiredOutcomes.map((outcome) =>
      outcome?.status === 'success' ? outcome.value : null,
    )

    if (node.type === 'compare') {
      if (
        typeof values[0] !== 'number' ||
        typeof values[1] !== 'number'
      ) {
        return finish(
          nodeId,
          setError(
            nodeId,
            'type-mismatch',
            'Compare принимает числа на входах A и B',
          ),
        )
      }

      return finish(nodeId, {
        status: 'success',
        value: compareValues(node, values[0], values[1]),
      })
    }

    if (
      typeof values[0] !== 'boolean' ||
      (node.data.operation !== 'not' && typeof values[1] !== 'boolean')
    ) {
      return finish(
        nodeId,
        setError(
          nodeId,
          'type-mismatch',
          'Logic принимает boolean на обязательных входах',
        ),
      )
    }

    return finish(nodeId, {
      status: 'success',
      value: applyLogic(
        node,
        values[0],
        typeof values[1] === 'boolean' ? values[1] : undefined,
      ),
    })
  }

  nodes.forEach((node) => {
    evaluateNode(node.id)
  })

  const values = Object.fromEntries(
    nodes.map((node) => {
      const outcome = outcomes.get(node.id)
      const value = outcome?.status === 'success'
        ? outcome.value
        : null

      return [node.id, isGraphValue(value) ? value : null]
    }),
  )

  return { values, errors }
}
