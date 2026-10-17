import type { Edge } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import { clearEvaluationState } from '../engine/clearEvaluationState'
import { getConnectionIssue, isConnectionAllowed } from '../engine/connectionRules'
import { evaluateGraph } from '../engine/evaluateGraph'
import type {
  CompareNode,
  ContraptionNode,
  IndicatorMode,
  IndicatorNode,
  LogicNode,
  MathNode,
  NumberNode,
  OutputNode,
  RandomNode,
} from '../types'
import { getIndicatorPresentation } from './getIndicatorPresentation'

const position = { x: 0, y: 0 }
const displayState = { error: null, errorDetails: null }

const numberNode = (id: string, value: number): NumberNode => ({
  id,
  type: 'number',
  position,
  data: { value, ...displayState },
})

const mathNode = (id: string): MathNode => ({
  id,
  type: 'math',
  position,
  data: { value: null, operation: 'add', ...displayState },
})

const randomNode = (id: string): RandomNode => ({
  id,
  type: 'random',
  position,
  data: { min: 1, max: 10, value: null, ...displayState },
})

const compareNode = (id: string): CompareNode => ({
  id,
  type: 'compare',
  position,
  data: { value: null, operation: 'greater', ...displayState },
})

const logicNode = (id: string): LogicNode => ({
  id,
  type: 'logic',
  position,
  data: { value: null, operation: 'not', ...displayState },
})

const outputNode = (id: string): OutputNode => ({
  id,
  type: 'output',
  position,
  data: { value: null, ...displayState },
})

const indicatorNode = (
  id: string,
  mode: IndicatorMode = 'auto',
  min = 0,
  max = 100,
): IndicatorNode => ({
  id,
  type: 'indicator',
  position,
  data: {
    label: 'Детектор',
    mode,
    min,
    max,
    value: null,
    ...displayState,
  },
})

const edge = (
  id: string,
  source: string,
  target: string,
  sourceHandle: string | null = null,
  targetHandle: string | null = null,
): Edge => ({ id, source, target, sourceHandle, targetHandle })

const booleanGraph = (value: boolean): { nodes: ContraptionNode[]; edges: Edge[] } => ({
  nodes: [
    numberNode('a', value ? 2 : 1),
    numberNode('b', 1),
    compareNode('compare'),
  ],
  edges: [
    edge('a-compare', 'a', 'compare', null, 'a'),
    edge('b-compare', 'b', 'compare', null, 'b'),
  ],
})

describe('Indicator в execution engine', () => {
  it('получает number без преобразования', () => {
    const result = evaluateGraph(
      [numberNode('number', 42.5), indicatorNode('indicator')],
      [edge('input', 'number', 'indicator', null, 'value')],
    )

    expect(result.values.indicator).toBe(42.5)
  })

  it('получает boolean без преобразования', () => {
    const graph = booleanGraph(true)
    graph.nodes.push(indicatorNode('indicator', 'status'))
    graph.edges.push(edge('input', 'compare', 'indicator', 'result', 'value'))

    expect(evaluateGraph(graph.nodes, graph.edges).values.indicator).toBe(true)
  })

  it('оставляет Indicator без входа пустым', () => {
    const result = evaluateGraph([indicatorNode('indicator')], [])

    expect(result.values.indicator).toBeNull()
    expect(result.errors.indicator).toBeUndefined()
  })

  it('распространяет ошибку зависимости', () => {
    const result = evaluateGraph(
      [numberNode('bad', Number.NaN), indicatorNode('indicator')],
      [edge('input', 'bad', 'indicator', null, 'value')],
    )

    expect(result.errors.bad.code).toBe('invalid-number')
    expect(result.errors.indicator.code).toBe('dependency-error')
  })

  it('проверяет диапазон и совместимость режима', () => {
    const invalidRange = evaluateGraph(
      [numberNode('number', 5), indicatorNode('indicator', 'gauge', 10, 10)],
      [edge('input', 'number', 'indicator', null, 'value')],
    )
    const wrongMode = evaluateGraph(
      [numberNode('number', 5), indicatorNode('indicator', 'status')],
      [edge('input', 'number', 'indicator', null, 'value')],
    )

    expect(invalidRange.errors.indicator.code).toBe('invalid-indicator-range')
    expect(wrongMode.errors.indicator.code).toBe('indicator-mode-mismatch')
  })

  it('не мутирует входы и вычисляет независимую ветку', () => {
    const nodes: ContraptionNode[] = [
      numberNode('bad', Number.NaN),
      indicatorNode('bad-indicator'),
      numberNode('good', 9),
      outputNode('output'),
    ]
    const edges = [
      edge('bad-input', 'bad', 'bad-indicator', null, 'value'),
      edge('good-output', 'good', 'output'),
    ]
    const beforeNodes = structuredClone(nodes)
    const beforeEdges = structuredClone(edges)
    const result = evaluateGraph(nodes, edges)

    expect(result.errors['bad-indicator'].code).toBe('dependency-error')
    expect(result.values.output).toBe(9)
    expect(nodes).toEqual(beforeNodes)
    expect(edges).toEqual(beforeEdges)
  })
})

describe('соединения Indicator', () => {
  const indicator = indicatorNode('indicator')
  const sources: ContraptionNode[] = [
    numberNode('number', 1),
    mathNode('math'),
    randomNode('random'),
    compareNode('compare'),
    logicNode('logic'),
  ]
  const nodes = [...sources, indicator, outputNode('output')]

  it.each([
    ['number', null],
    ['math', 'result'],
    ['random', null],
    ['compare', 'result'],
    ['logic', 'result'],
  ])('разрешает %s → Indicator', (source, sourceHandle) => {
    expect(isConnectionAllowed(
      { source, target: 'indicator', sourceHandle, targetHandle: 'value' },
      nodes,
      [],
    )).toBe(true)
  })

  it('запрещает исходящие связи Indicator', () => {
    expect(getConnectionIssue(
      { source: 'indicator', target: 'output' },
      nodes,
      [],
    )?.code).toBe('invalid-direction')
  })

  it('запрещает второй вход', () => {
    const existing = [edge('existing', 'number', 'indicator', null, 'value')]

    expect(getConnectionIssue(
      { source: 'random', target: 'indicator', targetHandle: 'value' },
      nodes,
      existing,
    )?.code).toBe('input-occupied')
  })

  it('запрещает несуществующий handle', () => {
    expect(getConnectionIssue(
      { source: 'number', target: 'indicator', targetHandle: 'missing' },
      nodes,
      [],
    )?.code).toBe('invalid-handle')
  })
})

describe('визуальное состояние Indicator', () => {
  const presentation = (
    value: number | boolean | null,
    mode: IndicatorMode = 'auto',
    min = 0,
    max = 100,
    error: string | null = null,
  ) => getIndicatorPresentation({
    value,
    mode,
    min,
    max,
    error,
    errorDetails: error ? 'техническая причина' : null,
  })

  it('AUTO отображает number как шкалу', () => {
    expect(presentation(25)).toMatchObject({ kind: 'gauge', percent: 25 })
  })

  it('AUTO отображает boolean как статус', () => {
    expect(presentation(true)).toMatchObject({ kind: 'status', active: true })
  })

  it.each([
    [true, '🦝 ЕНОТ ОДОБРЯЕТ'],
    [false, '🦝 ЕНОТ НЕ ОДОБРЯЕТ'],
  ])('STATUS отображает %s', (value, text) => {
    expect(presentation(value, 'status')).toMatchObject({
      kind: 'status',
      active: value,
      text,
    })
  })

  it.each([
    [50, 50],
    [-10, 0],
    [150, 100],
  ])('GAUGE ограничивает заполнение для %s значением %s%%', (value, percent) => {
    expect(presentation(value, 'gauge')).toMatchObject({
      kind: 'gauge',
      value,
      percent,
    })
  })

  it('возвращает ошибку для неверного диапазона', () => {
    expect(presentation(5, 'gauge', 10, 10).kind).toBe('error')
  })

  it('возвращает ошибку для несовместимого режима и типа', () => {
    expect(presentation(5, 'status').kind).toBe('error')
    expect(presentation(true, 'gauge').kind).toBe('error')
  })

  it('возвращает пустое состояние', () => {
    expect(presentation(null)).toEqual({
      kind: 'empty',
      text: '⛏️ Енот ждёт сигнал.',
    })
  })

  it('использует существующую ошибку и техническую причину', () => {
    expect(presentation(null, 'auto', 0, 100, '🦝 Ошибка')).toEqual({
      kind: 'error',
      text: '🦝 Ошибка',
      details: 'техническая причина',
    })
  })
})

describe('устаревшие результаты', () => {
  it('очищает вычисляемые значения и ошибки, сохраняя Number', () => {
    const source = numberNode('number', 7)
    const indicator = indicatorNode('indicator')
    indicator.data.value = 7
    indicator.data.error = 'старая ошибка'

    const cleared = clearEvaluationState([source, indicator])

    expect(cleared[0].data.value).toBe(7)
    expect(cleared[1].data.value).toBeNull()
    expect(cleared[1].data.error).toBeNull()
  })
})
