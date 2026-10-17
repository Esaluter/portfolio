import type { Edge } from '@xyflow/react'
import { describe, expect, it, vi } from 'vitest'

import type {
  CompareNode,
  CompareOperation,
  ContraptionNode,
  LogicNode,
  LogicOperation,
  MathNode,
  NumberNode,
  OutputNode,
  RandomNode,
} from '../types'
import { getConnectionIssue, isConnectionAllowed } from './connectionRules'
import { getUserErrorMessage } from './errorMessages'
import {
  evaluateGraph,
  type EvaluationErrorCode,
} from './evaluateGraph'

const position = { x: 0, y: 0 }
const displayState = { error: null, errorDetails: null }

const numberNode = (id: string, value: number): NumberNode => ({
  id,
  type: 'number',
  position,
  data: { value, ...displayState },
})

const randomNode = (
  id: string,
  min = 1,
  max = 100,
): RandomNode => ({
  id,
  type: 'random',
  position,
  data: { min, max, value: null, ...displayState },
})

const mathNode = (id: string): MathNode => ({
  id,
  type: 'math',
  position,
  data: { value: null, operation: 'add', ...displayState },
})

const compareNode = (
  id: string,
  operation: CompareOperation = 'greater',
): CompareNode => ({
  id,
  type: 'compare',
  position,
  data: { value: null, operation, ...displayState },
})

const logicNode = (
  id: string,
  operation: LogicOperation = 'and',
): LogicNode => ({
  id,
  type: 'logic',
  position,
  data: { value: null, operation, ...displayState },
})

const outputNode = (id: string): OutputNode => ({
  id,
  type: 'output',
  position,
  data: { value: null, ...displayState },
})

const edge = (
  source: string,
  target: string,
  targetHandle?: string,
  sourceHandle?: string,
): Edge => ({
  id: `${source}-${target}-${targetHandle ?? 'default'}`,
  source,
  target,
  targetHandle,
  sourceHandle,
})

const compareGraph = (
  operation: CompareOperation,
  a: number,
  b: number,
) => {
  const nodes: ContraptionNode[] = [
    numberNode('a', a),
    numberNode('b', b),
    compareNode('compare', operation),
  ]
  const edges = [
    edge('a', 'compare', 'a'),
    edge('b', 'compare', 'b'),
  ]

  return { nodes, edges }
}

const addBooleanSource = (
  nodes: ContraptionNode[],
  edges: Edge[],
  prefix: string,
  value: boolean,
) => {
  nodes.push(
    numberNode(`${prefix}-a`, 1),
    numberNode(`${prefix}-b`, value ? 1 : 2),
    compareNode(prefix, 'equal'),
  )
  edges.push(
    edge(`${prefix}-a`, prefix, 'a'),
    edge(`${prefix}-b`, prefix, 'b'),
  )
}

const evaluateLogic = (
  operation: LogicOperation,
  a: boolean,
  b?: boolean,
) => {
  const nodes: ContraptionNode[] = [logicNode('logic', operation)]
  const edges: Edge[] = []
  addBooleanSource(nodes, edges, 'source-a', a)
  edges.push(edge('source-a', 'logic', 'a', 'result'))

  if (b !== undefined) {
    addBooleanSource(nodes, edges, 'source-b', b)
    edges.push(edge('source-b', 'logic', 'b', 'result'))
  }

  return evaluateGraph(nodes, edges)
}

describe('Random', () => {
  it('генерирует целое число в корректном диапазоне', () => {
    const result = evaluateGraph(
      [randomNode('random', 10, 20)],
      [],
      { random: () => 0.5 },
    )

    expect(result.values.random).toBe(15)
  })

  it('включает обе границы диапазона', () => {
    const nodes = [randomNode('random', 3, 7)]

    expect(evaluateGraph(nodes, [], { random: () => 0 }).values.random).toBe(3)
    expect(evaluateGraph(nodes, [], { random: () => 0.999999 }).values.random).toBe(7)
  })

  it('поддерживает Min = Max', () => {
    expect(
      evaluateGraph(
        [randomNode('random', 4, 4)],
        [],
        { random: () => 0.75 },
      ).values.random,
    ).toBe(4)
  })

  it('отклоняет Min > Max', () => {
    const result = evaluateGraph([randomNode('random', 5, 4)], [])

    expect(result.errors.random.code).toBe('invalid-random-range')
    expect(result.values.random).toBeNull()
  })

  it.each([
    [1.5, 5],
    [1, 5.5],
    [Number.POSITIVE_INFINITY, 5],
    [1, Number.NaN],
  ])('отклоняет нецелую или неконечную границу %s..%s', (min, max) => {
    expect(
      evaluateGraph([randomNode('random', min, max)], []).errors.random.code,
    ).toBe('invalid-random-range')
  })

  it('использует детерминированный RNG', () => {
    const rng = vi.fn(() => 0.25)
    const result = evaluateGraph(
      [randomNode('random', 0, 8)],
      [],
      { random: rng },
    )

    expect(result.values.random).toBe(2)
    expect(rng).toHaveBeenCalledOnce()
  })

  it('вычисляет один Random один раз для нескольких потребителей', () => {
    const rng = vi.fn(() => 0.4)
    const nodes = [
      randomNode('random', 1, 10),
      mathNode('first'),
      mathNode('second'),
    ]
    const edges = [
      edge('random', 'first'),
      edge('random', 'second'),
    ]
    const result = evaluateGraph(nodes, edges, { random: rng })

    expect(result.values.first).toBe(5)
    expect(result.values.second).toBe(5)
    expect(rng).toHaveBeenCalledOnce()
  })

  it('запускает новую генерацию при новом evaluateGraph', () => {
    const rng = vi.fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99)
    const nodes = [randomNode('random', 1, 10)]

    expect(evaluateGraph(nodes, [], { random: rng }).values.random).toBe(1)
    expect(evaluateGraph(nodes, [], { random: rng }).values.random).toBe(10)
    expect(rng).toHaveBeenCalledTimes(2)
  })
})

describe('Compare', () => {
  it.each<[
    CompareOperation,
    number,
    number,
    boolean,
  ]>([
    ['greater', 3, 2, true],
    ['less', 3, 2, false],
    ['greater-or-equal', 3, 3, true],
    ['less-or-equal', 3, 3, true],
    ['equal', 3, 3, true],
    ['not-equal', 3, 2, true],
  ])('выполняет операцию %s', (operation, a, b, expected) => {
    const graph = compareGraph(operation, a, b)

    expect(evaluateGraph(graph.nodes, graph.edges).values.compare).toBe(expected)
  })

  it('определяет порядок операндов по handle A/B', () => {
    const graph = compareGraph('greater', 10, 5)

    expect(evaluateGraph(graph.nodes, graph.edges.reverse()).values.compare).toBe(true)
  })

  it('оставляет результат пустым без обязательного входа', () => {
    const nodes = [numberNode('a', 10), compareNode('compare')]
    const result = evaluateGraph(nodes, [edge('a', 'compare', 'a')])

    expect(result.values.compare).toBeNull()
    expect(result.errors.compare).toBeUndefined()
  })

  it('распространяет ошибку зависимости', () => {
    const nodes = [
      numberNode('bad', Number.NaN),
      numberNode('b', 1),
      compareNode('compare'),
    ]
    const edges = [
      edge('bad', 'compare', 'a'),
      edge('b', 'compare', 'b'),
    ]
    const result = evaluateGraph(nodes, edges)

    expect(result.errors.compare.code).toBe('dependency-error')
    expect(result.values.compare).toBeNull()
  })
})

describe('Logic', () => {
  it.each<[
    LogicOperation,
    boolean,
    boolean | undefined,
    boolean,
  ]>([
    ['and', true, true, true],
    ['and', true, false, false],
    ['or', false, false, false],
    ['or', true, false, true],
    ['not', true, undefined, false],
    ['not', false, undefined, true],
    ['xor', true, false, true],
    ['xor', true, true, false],
  ])('вычисляет %s для %s и %s', (operation, a, b, expected) => {
    expect(evaluateLogic(operation, a, b).values.logic).toBe(expected)
  })

  it('NOT не требует вход B', () => {
    const result = evaluateLogic('not', true)

    expect(result.values.logic).toBe(false)
    expect(result.errors.logic).toBeUndefined()
  })

  it('оставляет результат пустым без обязательного входа', () => {
    const result = evaluateGraph([logicNode('logic', 'and')], [])

    expect(result.values.logic).toBeNull()
    expect(result.errors.logic).toBeUndefined()
  })

  it('проверяет все обязательные зависимости и распространяет ошибку', () => {
    const nodes: ContraptionNode[] = [
      numberNode('bad', Number.NaN),
      numberNode('one', 1),
      compareNode('bad-compare', 'equal'),
      logicNode('logic', 'and'),
    ]
    const edges = [
      edge('bad', 'bad-compare', 'a'),
      edge('one', 'bad-compare', 'b'),
      edge('bad-compare', 'logic', 'a', 'result'),
    ]
    addBooleanSource(nodes, edges, 'good', false)
    edges.push(edge('good', 'logic', 'b', 'result'))
    const result = evaluateGraph(nodes, edges)

    expect(result.errors.logic.code).toBe('dependency-error')
    expect(result.values.logic).toBeNull()
  })
})

describe('типы и соединения', () => {
  const nodes: ContraptionNode[] = [
    numberNode('number', 1),
    randomNode('random'),
    mathNode('math'),
    compareNode('compare'),
    logicNode('logic'),
    outputNode('output'),
  ]

  it('разрешает совместимые number и boolean соединения', () => {
    expect(isConnectionAllowed(
      { source: 'number', target: 'math', targetHandle: 'input' },
      nodes,
      [],
    )).toBe(true)
    expect(isConnectionAllowed(
      { source: 'random', target: 'compare', targetHandle: 'a' },
      nodes,
      [],
    )).toBe(true)
    expect(isConnectionAllowed(
      { source: 'compare', sourceHandle: 'result', target: 'logic', targetHandle: 'a' },
      nodes,
      [],
    )).toBe(true)
    expect(isConnectionAllowed(
      { source: 'logic', sourceHandle: 'result', target: 'output' },
      nodes,
      [],
    )).toBe(true)
  })

  it('отклоняет несовместимые типы', () => {
    expect(getConnectionIssue(
      { source: 'number', target: 'logic', targetHandle: 'a' },
      nodes,
      [],
    )?.code).toBe('type-mismatch')
    expect(getConnectionIssue(
      { source: 'compare', sourceHandle: 'result', target: 'math' },
      nodes,
      [],
    )?.code).toBe('type-mismatch')
  })

  it('ограничивает каждый вход A/B одной связью', () => {
    const existing = [edge('number', 'compare', 'a')]

    expect(getConnectionIssue(
      { source: 'random', target: 'compare', targetHandle: 'a' },
      nodes,
      existing,
    )?.code).toBe('input-occupied')
    expect(isConnectionAllowed(
      { source: 'random', target: 'compare', targetHandle: 'b' },
      nodes,
      existing,
    )).toBe(true)
  })

  it('запрещает дублирующиеся соединения', () => {
    const existing = [edge('number', 'math', 'input')]

    expect(getConnectionIssue(
      { source: 'number', target: 'math', targetHandle: 'input' },
      nodes,
      existing,
    )?.code).toBe('duplicate')
  })

  it('сохраняет максимум один вход Output', () => {
    const existing = [edge('number', 'output')]

    expect(getConnectionIssue(
      { source: 'logic', sourceHandle: 'result', target: 'output' },
      nodes,
      existing,
    )?.code).toBe('input-occupied')
  })

  it('отклоняет отсутствующие handle', () => {
    expect(getConnectionIssue(
      { source: 'number', target: 'compare' },
      nodes,
      [],
    )?.code).toBe('invalid-handle')
    expect(getConnectionIssue(
      { source: 'number', target: 'compare', targetHandle: 'c' },
      nodes,
      [],
    )?.code).toBe('invalid-handle')
  })

  it('не разрешает B у Logic/NOT', () => {
    const notNodes = nodes.map((node) =>
      node.id === 'logic' ? logicNode('logic', 'not') : node,
    )

    expect(getConnectionIssue(
      { source: 'compare', sourceHandle: 'result', target: 'logic', targetHandle: 'b' },
      notNodes,
      [],
    )?.code).toBe('invalid-handle')
  })

  it.each<LogicOperation>(['and', 'or', 'xor'])(
    'разрешает Compare → Logic/A и Logic/B для %s',
    (operation) => {
      const operationNodes = nodes.map((node) =>
        node.id === 'logic' ? logicNode('logic', operation) : node,
      )
      const inputA = edge('compare', 'logic', 'a', 'result')

      expect(isConnectionAllowed(inputA, operationNodes, [])).toBe(true)
      expect(isConnectionAllowed(
        {
          source: 'compare',
          sourceHandle: 'result',
          target: 'logic',
          targetHandle: 'b',
        },
        operationNodes,
        [inputA],
      )).toBe(true)
    },
  )

  it('разрешает Logic → Output и Logic → Logic/A', () => {
    expect(isConnectionAllowed(
      {
        source: 'logic',
        sourceHandle: 'result',
        target: 'output',
      },
      nodes,
      [],
    )).toBe(true)

    const secondLogic = logicNode('logic-2')

    expect(isConnectionAllowed(
      {
        source: 'logic',
        sourceHandle: 'result',
        target: 'logic-2',
        targetHandle: 'a',
      },
      [...nodes, secondLogic],
      [],
    )).toBe(true)
  })

  it('сохраняет запрет Number → Logic и Logic → Math', () => {
    expect(getConnectionIssue(
      { source: 'number', target: 'logic', targetHandle: 'a' },
      nodes,
      [],
    )?.code).toBe('type-mismatch')
    expect(getConnectionIssue(
      {
        source: 'logic',
        sourceHandle: 'result',
        target: 'math',
        targetHandle: 'input',
      },
      nodes,
      [],
    )?.code).toBe('type-mismatch')
  })

  it('engine отклоняет несовместимую связь, попавшую в граф в обход UI', () => {
    const result = evaluateGraph(
      [numberNode('n', 1), compareNode('boolean'), mathNode('math')],
      [
        edge('n', 'boolean', 'a'),
        edge('n', 'boolean', 'b'),
        edge('boolean', 'math', 'input', 'result'),
      ],
    )

    expect(result.errors.math.code).toBe('type-mismatch')
    expect(result.values.math).toBeNull()
  })
})

describe('смешанные цепочки и сообщения ошибок', () => {
  it('вычисляет Random → Output', () => {
    const result = evaluateGraph(
      [randomNode('random', 1, 6), outputNode('out')],
      [edge('random', 'out')],
      { random: () => 0.5 },
    )

    expect(result.values.out).toBe(4)
  })

  it('вычисляет Random → Math → Output', () => {
    const nodes = [
      randomNode('random', 2, 2),
      numberNode('three', 3),
      mathNode('sum'),
      outputNode('out'),
    ]
    const edges = [
      edge('random', 'sum'),
      edge('three', 'sum'),
      edge('sum', 'out', undefined, 'result'),
    ]

    expect(evaluateGraph(nodes, edges).values.out).toBe(5)
  })

  it('вычисляет Number → Compare → Output', () => {
    const graph = compareGraph('greater', 10, 5)
    graph.nodes.push(outputNode('out'))
    graph.edges.push(edge('compare', 'out', undefined, 'result'))

    expect(evaluateGraph(graph.nodes, graph.edges).values.out).toBe(true)
  })

  it('вычисляет Math → Compare → Logic → Output', () => {
    const nodes: ContraptionNode[] = [
      numberNode('two', 2),
      numberNode('three', 3),
      mathNode('sum'),
      numberNode('four', 4),
      compareNode('compare', 'greater'),
      logicNode('not', 'not'),
      outputNode('out'),
    ]
    const edges = [
      edge('two', 'sum'),
      edge('three', 'sum'),
      edge('sum', 'compare', 'a', 'result'),
      edge('four', 'compare', 'b'),
      edge('compare', 'not', 'a', 'result'),
      edge('not', 'out', undefined, 'result'),
    ]

    expect(evaluateGraph(nodes, edges).values.out).toBe(false)
  })

  it.each<[
    EvaluationErrorCode,
    string,
  ]>([
    ['division-by-zero', '🦝 Вселенная отказалась делиться на ноль.'],
    ['cycle', '🦝 Енот бегает по кругу. Выход не найден.'],
    ['dependency-error', '⛏️ Предыдущий енот сломал вычисления.'],
    ['type-mismatch', '🦝 Еноту дали не ту деталь.'],
    ['invalid-random-range', '🎲 Енот перепутал границы случайности.'],
    ['invalid-number', '🦝 Енот нашёл число из другой вселенной.'],
  ])('возвращает стабильное сообщение для %s', (code, message) => {
    expect(getUserErrorMessage(code)).toBe(message)
  })

  it('возвращает нейтральный fallback для неизвестного кода', () => {
    expect(getUserErrorMessage('unknown')).toBe(
      '🦝 Что-то пошло не по енотовому плану.',
    )
  })

  it('не превращает ошибку в значение', () => {
    const result = evaluateGraph([randomNode('random', 2, 1)], [])

    expect(result.values.random).toBeNull()
    expect(result.errors.random).toBeDefined()
  })
})
