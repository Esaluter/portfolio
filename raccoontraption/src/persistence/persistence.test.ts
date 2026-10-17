import type { Edge } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type { ContraptionNode, IndicatorNode } from '../types'
import { deserializeGraph } from './deserializeGraph'
import { serializeGraph, serializeGraphToJson } from './serializeGraph'
import {
  GRAPH_FORMAT,
  GRAPH_VERSION,
  MAX_FILE_SIZE_BYTES,
  type SavedGraphV1,
} from './types'

const nodes: ContraptionNode[] = [
  {
    id: 'number',
    type: 'number',
    position: { x: 10, y: 20 },
    data: {
      value: 7,
      error: 'ошибка',
      errorDetails: 'детали',
      onChange: () => undefined,
    },
  },
  {
    id: 'math',
    type: 'math',
    position: { x: 200, y: 20 },
    data: {
      value: 99,
      operation: 'multiply',
      error: null,
      errorDetails: null,
      onOperationChange: () => undefined,
    },
  },
  {
    id: 'random',
    type: 'random',
    position: { x: 10, y: 180 },
    data: {
      min: -2,
      max: 4,
      value: 3,
      error: null,
      errorDetails: null,
      onRangeChange: () => undefined,
    },
  },
  {
    id: 'compare',
    type: 'compare',
    position: { x: 400, y: 20 },
    data: {
      value: true,
      operation: 'greater-or-equal',
      error: null,
      errorDetails: null,
      onOperationChange: () => undefined,
    },
  },
  {
    id: 'logic',
    type: 'logic',
    position: { x: 600, y: 20 },
    data: {
      value: false,
      operation: 'not',
      error: 'старая ошибка',
      errorDetails: 'старая причина',
      onOperationChange: () => undefined,
    },
  },
  {
    id: 'output',
    type: 'output',
    position: { x: 800, y: 20 },
    data: {
      value: false,
      error: null,
      errorDetails: null,
    },
  },
]

const edges: Edge[] = [
  {
    id: 'number-math',
    source: 'number',
    target: 'math',
    sourceHandle: null,
    targetHandle: 'input',
  },
  {
    id: 'math-compare-a',
    source: 'math',
    target: 'compare',
    sourceHandle: 'result',
    targetHandle: 'a',
  },
  {
    id: 'random-compare-b',
    source: 'random',
    target: 'compare',
    sourceHandle: null,
    targetHandle: 'b',
  },
  {
    id: 'compare-logic-a',
    source: 'compare',
    target: 'logic',
    sourceHandle: 'result',
    targetHandle: 'a',
  },
  {
    id: 'logic-output',
    source: 'logic',
    target: 'output',
    sourceHandle: 'result',
    targetHandle: null,
  },
]

const savedGraph = (): SavedGraphV1 => serializeGraph(nodes, edges)

type MutableGraph = {
  format: unknown
  version: unknown
  nodes: Array<Record<string, unknown>>
  edges: Array<Record<string, unknown>>
}

const mutableGraph = (): MutableGraph =>
  structuredClone(savedGraph()) as unknown as MutableGraph

const importValue = (value: unknown) => deserializeGraph(JSON.stringify(value))

const indicatorNode: IndicatorNode = {
  id: 'indicator',
  type: 'indicator',
  position: { x: 900, y: 120 },
  data: {
    label: 'Детектор удачи',
    mode: 'gauge',
    min: -10,
    max: 50,
    value: 25,
    error: 'старая ошибка',
    errorDetails: 'старая причина',
    onSettingsChange: () => undefined,
  },
}

describe('экспорт графа', () => {
  it('экспортирует версию, все типы блоков и только редактируемые параметры', () => {
    const graph = savedGraph()

    expect(graph.format).toBe(GRAPH_FORMAT)
    expect(graph.version).toBe(GRAPH_VERSION)
    expect(graph.nodes.map((node) => node.type)).toEqual([
      'number',
      'math',
      'random',
      'compare',
      'logic',
      'output',
    ])
    expect(graph.nodes.map((node) => node.data)).toEqual([
      { value: 7 },
      { operation: 'multiply' },
      { min: -2, max: 4 },
      { operation: 'greater-or-equal' },
      { operation: 'not' },
      {},
    ])
  })

  it('сохраняет позиции, ID связей и идентификаторы портов', () => {
    const graph = savedGraph()

    expect(graph.nodes[0].position).toEqual({ x: 10, y: 20 })
    expect(graph.edges).toEqual(edges)
  })

  it('не сохраняет callbacks, ошибки, выделение и вычисленные результаты', () => {
    const json = serializeGraphToJson(
      nodes.map((node) => ({ ...node, selected: true })),
      edges.map((edge) => ({ ...edge, selected: true })),
    )

    expect(json).not.toContain('onChange')
    expect(json).not.toContain('onOperationChange')
    expect(json).not.toContain('errorDetails')
    expect(json).not.toContain('старая ошибка')
    expect(json).not.toContain('selected')
    expect(JSON.parse(json)).toEqual(savedGraph())
  })

  it('не мутирует исходные узлы и связи', () => {
    const beforeNodes = structuredClone(nodes.map((node) => ({
      ...node,
      data: { ...node.data, onChange: undefined, onOperationChange: undefined, onRangeChange: undefined },
    })))
    const beforeEdges = structuredClone(edges)

    serializeGraph(nodes, edges)

    expect(nodes.map((node) => ({
      ...node,
      data: { ...node.data, onChange: undefined, onOperationChange: undefined, onRangeChange: undefined },
    }))).toEqual(beforeNodes)
    expect(edges).toEqual(beforeEdges)
  })
})

describe('импорт и round-trip', () => {
  it('восстанавливает ID, типы, позиции, параметры и связи', () => {
    const result = deserializeGraph(serializeGraphToJson(nodes, edges))

    expect(result.ok).toBe(true)

    if (!result.ok) return

    expect(serializeGraph(result.graph.nodes, result.graph.edges)).toEqual(savedGraph())
  })

  it('очищает вычисленные значения и ошибки', () => {
    const result = deserializeGraph(serializeGraphToJson(nodes, edges))

    if (!result.ok) throw new Error(result.error.message)

    for (const node of result.graph.nodes) {
      expect(node.data.error).toBeNull()
      expect(node.data.errorDetails).toBeNull()

      if (node.type !== 'number') {
        expect(node.data.value).toBeNull()
      }
    }
  })

  it('принимает пустой граф', () => {
    const result = importValue({
      format: GRAPH_FORMAT,
      version: GRAPH_VERSION,
      nodes: [],
      edges: [],
    })

    expect(result).toEqual({ ok: true, graph: { nodes: [], edges: [] } })
  })

  it('принимает структурно корректный цикл', () => {
    const graph: SavedGraphV1 = {
      format: GRAPH_FORMAT,
      version: GRAPH_VERSION,
      nodes: [{
        id: 'math',
        type: 'math',
        position: { x: 0, y: 0 },
        data: { operation: 'add' },
      }],
      edges: [{
        id: 'loop',
        source: 'math',
        target: 'math',
        sourceHandle: 'result',
        targetHandle: 'input',
      }],
    }

    expect(importValue(graph).ok).toBe(true)
  })

  it('не разделяет изменяемые объекты с разобранным документом', () => {
    const graph = savedGraph()
    const result = importValue(graph)

    if (!result.ok) throw new Error(result.error.message)

    result.graph.nodes[0].position.x = 999
    result.graph.edges[0].source = 'changed'

    expect(graph.nodes[0].position.x).toBe(10)
    expect(graph.edges[0].source).toBe('number')
  })
})

describe('защита импорта', () => {
  it('отклоняет неверный JSON', () => {
    expect(deserializeGraph('{').ok).toBe(false)
    expect(deserializeGraph('{').ok && 'unexpected').toBe(false)
  })

  it('отклоняет неизвестный формат', () => {
    const graph = mutableGraph()
    graph.format = 'other'

    const result = importValue(graph)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('invalid-format')
  })

  it('отклоняет неподдерживаемую версию', () => {
    const graph = mutableGraph()
    graph.version = 2

    const result = importValue(graph)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('unsupported-version')
  })

  it('отклоняет неизвестный тип блока и лишние поля', () => {
    const unknownType = mutableGraph()
    unknownType.nodes[0].type = 'script'
    expect(importValue(unknownType).ok).toBe(false)

    const executableField = mutableGraph()
    executableField.nodes[0].execute = 'alert(1)'
    expect(importValue(executableField).ok).toBe(false)
  })

  it('отклоняет повторяющиеся ID узлов и связей', () => {
    const duplicateNode = mutableGraph()
    duplicateNode.nodes[1].id = duplicateNode.nodes[0].id
    expect(importValue(duplicateNode).ok).toBe(false)

    const duplicateEdge = mutableGraph()
    duplicateEdge.edges[1].id = duplicateEdge.edges[0].id
    expect(importValue(duplicateEdge).ok).toBe(false)
  })

  it('отклоняет отсутствующие узлы', () => {
    const graph = mutableGraph()
    graph.edges[0].source = 'missing'

    const result = importValue(graph)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('invalid-edge')
  })

  it('отклоняет несовместимые соединения', () => {
    const graph = mutableGraph()
    graph.edges[0] = {
      id: 'bad-type',
      source: 'number',
      target: 'logic',
      sourceHandle: null,
      targetHandle: 'a',
    }

    const result = importValue(graph)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('invalid-connection')
  })

  it('отклоняет неверные handles', () => {
    const graph = mutableGraph()
    graph.edges[0].targetHandle = 'wrong'

    const result = importValue(graph)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('invalid-connection')
  })

  it('отклоняет повторную связь и занятый одиночный вход', () => {
    const duplicate = mutableGraph()
    duplicate.edges.push({ ...duplicate.edges[0], id: 'duplicate-connection' })
    expect(importValue(duplicate).ok).toBe(false)

    const occupied = mutableGraph()
    occupied.edges.push({
      id: 'occupied',
      source: 'random',
      target: 'compare',
      sourceHandle: null,
      targetHandle: 'a',
    })
    expect(importValue(occupied).ok).toBe(false)
  })

  it('отклоняет неверные координаты', () => {
    const graph = mutableGraph()
    graph.nodes[0].position = { x: Number.POSITIVE_INFINITY, y: 0 }

    const result = importValue(graph)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('invalid-node')
  })

  it('отклоняет невалидные параметры каждого семейства', () => {
    const invalidValues: Array<[number, Record<string, unknown>]> = [
      [0, { value: '7' }],
      [1, { operation: 'power' }],
      [2, { min: 10, max: 1 }],
      [3, { operation: 'approximately' }],
      [4, { operation: 'nand' }],
      [5, { value: 1 }],
    ]

    for (const [index, data] of invalidValues) {
      const graph = mutableGraph()
      graph.nodes[index].data = data
      expect(importValue(graph).ok).toBe(false)
    }
  })

  it('отклоняет слишком большой файл', () => {
    const result = deserializeGraph(' '.repeat(MAX_FILE_SIZE_BYTES + 1))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('file-too-large')
  })
})

describe('Indicator в JSON v1', () => {
  const indicatorEdge: Edge = {
    id: 'number-indicator',
    source: 'number',
    target: 'indicator',
    sourceHandle: null,
    targetHandle: 'value',
  }

  it('экспортирует параметры Indicator без runtime-данных', () => {
    const graph = serializeGraph([nodes[0], indicatorNode], [indicatorEdge])
    const savedIndicator = graph.nodes[1]

    expect(savedIndicator).toEqual({
      id: 'indicator',
      type: 'indicator',
      position: { x: 900, y: 120 },
      data: {
        label: 'Детектор удачи',
        mode: 'gauge',
        min: -10,
        max: 50,
      },
    })
    expect(JSON.stringify(savedIndicator)).not.toContain('старая ошибка')
    expect(JSON.stringify(savedIndicator)).not.toContain('onSettingsChange')
    expect(JSON.stringify(savedIndicator)).not.toContain('"value"')
  })

  it('импортирует Indicator, его параметры и handle value', () => {
    const json = serializeGraphToJson([nodes[0], indicatorNode], [indicatorEdge])
    const result = deserializeGraph(json)

    if (!result.ok) throw new Error(result.error.message)

    const restored = result.graph.nodes[1]
    expect(restored.type).toBe('indicator')
    expect(restored.data).toMatchObject({
      label: 'Детектор удачи',
      mode: 'gauge',
      min: -10,
      max: 50,
      value: null,
      error: null,
      errorDetails: null,
    })
    expect(result.graph.edges[0].targetHandle).toBe('value')
  })

  it('выполняет round-trip Indicator без повышения версии', () => {
    const graph = serializeGraph([nodes[0], indicatorNode], [indicatorEdge])
    const result = deserializeGraph(JSON.stringify(graph))

    if (!result.ok) throw new Error(result.error.message)

    expect(graph.version).toBe(1)
    expect(serializeGraph(result.graph.nodes, result.graph.edges)).toEqual(graph)
  })

  it('продолжает импортировать старый JSON v1 без Indicator', () => {
    const result = deserializeGraph(JSON.stringify(savedGraph()))

    expect(result.ok).toBe(true)
  })

  it('отклоняет невалидные параметры Indicator', () => {
    const base = serializeGraph([nodes[0], indicatorNode], [indicatorEdge])
    const invalidData = [
      { label: 'x'.repeat(61), mode: 'gauge', min: 0, max: 100 },
      { label: 'Индикатор', mode: 'unknown', min: 0, max: 100 },
      { label: 'Индикатор', mode: 'gauge', min: 10, max: 10 },
      { label: 'Индикатор', mode: 'gauge', min: 20, max: 10 },
    ]

    for (const data of invalidData) {
      const graph = structuredClone(base) as unknown as MutableGraph
      graph.nodes[1].data = data
      expect(importValue(graph).ok).toBe(false)
    }
  })
})
