import type { Edge } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import { getConnectionIssue } from '../engine/connectionRules'
import { serializeGraph } from '../persistence/serializeGraph'
import type { ContraptionNode } from '../types'
import { demoExamples, type DemoExample } from './demoGraphs'
import { prepareExampleLoad } from './prepareExampleLoad'

const currentNodes: ContraptionNode[] = [
  {
    id: 'current-number',
    type: 'number',
    position: { x: 12, y: 34 },
    data: { value: 9, error: null, errorDetails: null },
  },
]

const currentEdges: Edge[] = []

const load = (example: DemoExample) => {
  const result = prepareExampleLoad(example, {
    nodes: currentNodes,
    edges: currentEdges,
  })

  expect(result.ok).toBe(true)
  if (!result.ok) {
    throw new Error(result.error.message)
  }

  return result
}

describe('demo gallery graphs', () => {
  it('contains four examples with stable unique identifiers', () => {
    expect(demoExamples).toHaveLength(4)
    expect(new Set(demoExamples.map((example) => example.id)).size).toBe(4)
    expect(demoExamples.map((example) => example.id)).toEqual([
      'fate-dice',
      'luck-detector',
      'logic-lab',
      'calculation-machine',
    ])
  })

  it.each(demoExamples)('loads $title through the regular JSON validator', (example) => {
    const result = load(example)

    expect(serializeGraph(result.graph.nodes, result.graph.edges)).toEqual(example.graph)
  })

  it.each(demoExamples)('contains only valid connections in $title', (example) => {
    const { graph } = load(example)
    const acceptedEdges: Edge[] = []

    for (const edge of graph.edges) {
      expect(getConnectionIssue(edge, graph.nodes, acceptedEdges)).toBeNull()
      acceptedEdges.push(edge)
    }
  })

  it('keeps the promised parameters of the four examples', () => {
    const dice = demoExamples[0].graph.nodes
    expect(dice.find((node) => node.type === 'random')?.data).toEqual({ min: 1, max: 6 })
    expect(dice.find((node) => node.type === 'indicator')?.data).toMatchObject({ mode: 'gauge', min: 1, max: 6 })

    const luck = demoExamples[1].graph.nodes
    expect(luck.find((node) => node.id === 'luck-threshold')?.data).toEqual({ value: 50 })
    expect(luck.find((node) => node.type === 'compare')?.data).toEqual({ operation: 'greater' })
    expect(luck.find((node) => node.type === 'indicator')?.data).toMatchObject({ mode: 'status' })

    const laboratory = demoExamples[2].graph.nodes
    expect(laboratory.filter((node) => node.type === 'compare')).toHaveLength(2)
    expect(laboratory.find((node) => node.type === 'logic')?.data).toEqual({ operation: 'and' })

    const calculation = demoExamples[3].graph.nodes
    expect(calculation.filter((node) => node.type === 'number')).toHaveLength(3)
    expect(calculation.find((node) => node.type === 'math')?.data).toEqual({ operation: 'add' })
  })

  it('clears computed values and errors without running an example', () => {
    for (const example of demoExamples) {
      const { graph } = load(example)

      for (const node of graph.nodes) {
        expect(node.data.error).toBeNull()
        expect(node.data.errorDetails).toBeNull()
        if (node.type !== 'number') {
          expect(node.data.value).toBeNull()
        }
      }
    }
  })

  it('returns an independent previous snapshot for one-step undo and redo', () => {
    const result = load(demoExamples[1])

    expect(result.previous).toEqual({ nodes: currentNodes, edges: currentEdges })
    expect(result.graph.nodes).not.toBe(currentNodes)
    expect(result.previous.nodes).not.toBe(currentNodes)

    const afterLoad = structuredClone(result.graph)
    const afterUndo = structuredClone(result.previous)
    const afterRedo = structuredClone(afterLoad)

    expect(afterUndo).toEqual({ nodes: currentNodes, edges: currentEdges })
    expect(serializeGraph(afterRedo.nodes, afterRedo.edges)).toEqual(demoExamples[1].graph)
  })

  it('does not mutate the current graph or the catalog entry', () => {
    const currentBefore = structuredClone({ nodes: currentNodes, edges: currentEdges })
    const exampleBefore = structuredClone(demoExamples[2])
    const result = load(demoExamples[2])

    result.graph.nodes[0].position.x = 9999
    result.previous.nodes[0].position.x = -9999

    expect({ nodes: currentNodes, edges: currentEdges }).toEqual(currentBefore)
    expect(demoExamples[2]).toEqual(exampleBefore)
  })

  it('fails atomically when an example contains an invalid connection', () => {
    const invalidExample = structuredClone(demoExamples[0]) as DemoExample
    invalidExample.graph.edges[0].target = 'missing-node'
    const currentBefore = structuredClone({ nodes: currentNodes, edges: currentEdges })

    const result = prepareExampleLoad(invalidExample, {
      nodes: currentNodes,
      edges: currentEdges,
    })

    expect(result.ok).toBe(false)
    expect({ nodes: currentNodes, edges: currentEdges }).toEqual(currentBefore)
  })

  it('creates a fresh editable graph on every repeated load', () => {
    const first = load(demoExamples[3])
    first.graph.nodes[0].position.x = 777
    const second = load(demoExamples[3])

    expect(second.graph.nodes[0].position.x).toBe(demoExamples[3].graph.nodes[0].position.x)
    expect(second.graph).not.toBe(first.graph)
  })
})
