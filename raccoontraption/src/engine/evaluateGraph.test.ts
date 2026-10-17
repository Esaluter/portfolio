import type { Edge } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type {
  ContraptionNode,
  MathOperation,
  MathNode,
  NumberNode,
  OutputNode,
} from '../types'
import { isConnectionAllowed } from './connectionRules'
import { evaluateGraph } from './evaluateGraph'

const position = { x: 0, y: 0 }

const numberNode = (id: string, value: number): NumberNode => ({
  id,
  type: 'number',
  position,
  data: { value, error: null, errorDetails: null },
})

const mathNode = (
  id: string,
  operation: MathOperation = 'add',
): MathNode => ({
  id,
  type: 'math',
  position,
  data: { value: null, error: null, errorDetails: null, operation },
})

const outputNode = (id: string): OutputNode => ({
  id,
  type: 'output',
  position,
  data: { value: null, error: null, errorDetails: null },
})

const edge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
})

describe('evaluateGraph', () => {
  it('возвращает значение Number', () => {
    const result = evaluateGraph([numberNode('n', 7)], [])

    expect(result.values.n).toBe(7)
    expect(result.errors).toEqual({})
  })

  it('вычисляет Number → Output', () => {
    const nodes = [numberNode('n', 4), outputNode('out')]
    const result = evaluateGraph(nodes, [edge('n', 'out')])

    expect(result.values.out).toBe(4)
  })

  it('складывает два входа Math', () => {
    const nodes = [numberNode('a', 2), numberNode('b', 3), mathNode('sum')]
    const result = evaluateGraph(nodes, [edge('a', 'sum'), edge('b', 'sum')])

    expect(result.values.sum).toBe(5)
  })

  it('складывает несколько входов Math', () => {
    const nodes = [
      numberNode('a', 1),
      numberNode('b', 2),
      numberNode('c', 3),
      mathNode('sum'),
    ]
    const edges = [edge('a', 'sum'), edge('b', 'sum'), edge('c', 'sum')]

    expect(evaluateGraph(nodes, edges).values.sum).toBe(6)
  })

  it('вычитает входы в порядке связей', () => {
    const nodes = [numberNode('a', 10), numberNode('b', 3), mathNode('math', 'subtract')]

    expect(evaluateGraph(nodes, [edge('a', 'math'), edge('b', 'math')]).values.math).toBe(7)
  })

  it('умножает входы', () => {
    const nodes = [numberNode('a', 4), numberNode('b', 5), mathNode('math', 'multiply')]

    expect(evaluateGraph(nodes, [edge('a', 'math'), edge('b', 'math')]).values.math).toBe(20)
  })

  it('делит входы в порядке связей', () => {
    const nodes = [numberNode('a', 20), numberNode('b', 4), mathNode('math', 'divide')]

    expect(evaluateGraph(nodes, [edge('a', 'math'), edge('b', 'math')]).values.math).toBe(5)
  })

  it('вычисляет цепочку Math → Math → Output', () => {
    const nodes = [
      numberNode('a', 2),
      numberNode('b', 3),
      numberNode('c', 4),
      mathNode('sum'),
      mathNode('product', 'multiply'),
      outputNode('out'),
    ]
    const edges = [
      edge('a', 'sum'),
      edge('b', 'sum'),
      edge('sum', 'product'),
      edge('c', 'product'),
      edge('product', 'out'),
    ]

    expect(evaluateGraph(nodes, edges).values.out).toBe(20)
  })

  it('оставляет Math без входов пустым', () => {
    const result = evaluateGraph([mathNode('math')], [])

    expect(result.values.math).toBeNull()
    expect(result.errors.math).toBeUndefined()
  })

  it('оставляет Output без входа пустым', () => {
    const result = evaluateGraph([outputNode('out')], [])

    expect(result.values.out).toBeNull()
    expect(result.errors.out).toBeUndefined()
  })

  it('возвращает контролируемую ошибку деления на ноль', () => {
    const nodes = [numberNode('a', 5), numberNode('zero', 0), mathNode('math', 'divide')]
    const result = evaluateGraph(nodes, [edge('a', 'math'), edge('zero', 'math')])

    expect(result.values.math).toBeNull()
    expect(result.errors.math.code).toBe('division-by-zero')
  })

  it('распространяет ошибку невычислимого входа в Math', () => {
    const nodes = [numberNode('bad', Number.NaN), mathNode('math')]
    const result = evaluateGraph(nodes, [edge('bad', 'math')])

    expect(result.errors.bad.code).toBe('invalid-number')
    expect(result.errors.math.code).toBe('dependency-error')
    expect(result.values.math).toBeNull()
  })

  it('обнаруживает цикл и связывает ошибку с его узлами', () => {
    const nodes = [mathNode('a'), mathNode('b')]
    const result = evaluateGraph(nodes, [edge('a', 'b'), edge('b', 'a')])

    expect(result.errors.a.code).toBe('cycle')
    expect(result.errors.b.code).toBe('cycle')
    expect(result.values.a).toBeNull()
    expect(result.values.b).toBeNull()
  })

  it('вычисляет независимую ветку при ошибке в другой ветке', () => {
    const nodes = [
      numberNode('ten', 10),
      numberNode('zero', 0),
      mathNode('bad', 'divide'),
      numberNode('two', 2),
      numberNode('three', 3),
      mathNode('good'),
      outputNode('out'),
    ]
    const edges = [
      edge('ten', 'bad'),
      edge('zero', 'bad'),
      edge('two', 'good'),
      edge('three', 'good'),
      edge('good', 'out'),
    ]
    const result = evaluateGraph(nodes, edges)

    expect(result.errors.bad.code).toBe('division-by-zero')
    expect(result.values.out).toBe(5)
  })

  it('успешно пересчитывает граф после исправления ошибки', () => {
    const brokenNodes = [
      numberNode('ten', 10),
      numberNode('divisor', 0),
      mathNode('math', 'divide'),
    ]
    const edges = [edge('ten', 'math'), edge('divisor', 'math')]

    expect(evaluateGraph(brokenNodes, edges).errors.math).toBeDefined()

    const fixedNodes = brokenNodes.map((node) =>
      node.id === 'divisor' ? numberNode('divisor', 2) : node,
    ) as ContraptionNode[]
    const fixedResult = evaluateGraph(fixedNodes, edges)

    expect(fixedResult.values.math).toBe(5)
    expect(fixedResult.errors.math).toBeUndefined()
  })

  it('не мутирует входные узлы и связи', () => {
    const nodes = [numberNode('n', 2), mathNode('math')]
    const edges = [edge('n', 'math')]
    const nodesSnapshot = structuredClone(nodes)
    const edgesSnapshot = structuredClone(edges)

    evaluateGraph(nodes, edges)

    expect(nodes).toEqual(nodesSnapshot)
    expect(edges).toEqual(edgesSnapshot)
  })

  it('не разрешает вторую входящую связь Output и неверные направления', () => {
    const nodes = [numberNode('a', 1), numberNode('b', 2), mathNode('math'), outputNode('out')]
    const existingEdges = [edge('a', 'out')]

    expect(isConnectionAllowed({ source: 'b', target: 'out' }, nodes, existingEdges)).toBe(false)
    expect(isConnectionAllowed({ source: 'a', target: 'math' }, nodes, existingEdges)).toBe(true)
    expect(isConnectionAllowed({ source: 'out', target: 'math' }, nodes, existingEdges)).toBe(false)
    expect(isConnectionAllowed({ source: 'math', target: 'a' }, nodes, existingEdges)).toBe(false)
  })
})
