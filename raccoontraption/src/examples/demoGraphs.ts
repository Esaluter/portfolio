import {
  GRAPH_FORMAT,
  GRAPH_VERSION,
  type SavedEdge,
  type SavedGraphV1,
  type SavedNode,
} from '../persistence/types'

export type DemoExample = {
  id: string
  title: string
  description: string
  graph: SavedGraphV1
}

const graph = (nodes: SavedNode[], edges: SavedEdge[]): SavedGraphV1 => ({
  format: GRAPH_FORMAT,
  version: GRAPH_VERSION,
  nodes,
  edges,
})

export const demoExamples: readonly DemoExample[] = [
  {
    id: 'fate-dice',
    title: '🎲 Кубик судьбы',
    description: 'Брось кубик и посмотри, что решит случайность.',
    graph: graph(
      [
        {
          id: 'dice-random',
          type: 'random',
          position: { x: 80, y: 180 },
          data: { min: 1, max: 6 },
        },
        {
          id: 'dice-indicator',
          type: 'indicator',
          position: { x: 390, y: 120 },
          data: { label: 'Кубик судьбы', mode: 'gauge', min: 1, max: 6 },
        },
      ],
      [
        {
          id: 'dice-random-indicator',
          source: 'dice-random',
          target: 'dice-indicator',
          sourceHandle: null,
          targetHandle: 'value',
        },
      ],
    ),
  },
  {
    id: 'luck-detector',
    title: '🦝 Детектор удачи',
    description: 'Узнай, одобряет ли енот сегодняшний эксперимент.',
    graph: graph(
      [
        {
          id: 'luck-random',
          type: 'random',
          position: { x: 40, y: 80 },
          data: { min: 1, max: 100 },
        },
        {
          id: 'luck-threshold',
          type: 'number',
          position: { x: 40, y: 280 },
          data: { value: 50 },
        },
        {
          id: 'luck-compare',
          type: 'compare',
          position: { x: 330, y: 130 },
          data: { operation: 'greater' },
        },
        {
          id: 'luck-indicator',
          type: 'indicator',
          position: { x: 680, y: 120 },
          data: { label: 'Детектор удачи', mode: 'status', min: 0, max: 100 },
        },
      ],
      [
        {
          id: 'luck-random-a',
          source: 'luck-random',
          target: 'luck-compare',
          sourceHandle: null,
          targetHandle: 'a',
        },
        {
          id: 'luck-threshold-b',
          source: 'luck-threshold',
          target: 'luck-compare',
          sourceHandle: null,
          targetHandle: 'b',
        },
        {
          id: 'luck-compare-indicator',
          source: 'luck-compare',
          target: 'luck-indicator',
          sourceHandle: 'result',
          targetHandle: 'value',
        },
      ],
    ),
  },
  {
    id: 'logic-lab',
    title: '🧠 Логическая лаборатория',
    description: 'Соедини два условия и проверь логику.',
    graph: graph(
      [
        { id: 'lab-a1', type: 'number', position: { x: 20, y: 20 }, data: { value: 8 } },
        { id: 'lab-b1', type: 'number', position: { x: 20, y: 150 }, data: { value: 5 } },
        { id: 'lab-a2', type: 'number', position: { x: 20, y: 330 }, data: { value: 3 } },
        { id: 'lab-b2', type: 'number', position: { x: 20, y: 460 }, data: { value: 7 } },
        {
          id: 'lab-compare-1',
          type: 'compare',
          position: { x: 280, y: 40 },
          data: { operation: 'greater' },
        },
        {
          id: 'lab-compare-2',
          type: 'compare',
          position: { x: 280, y: 340 },
          data: { operation: 'less' },
        },
        {
          id: 'lab-logic',
          type: 'logic',
          position: { x: 600, y: 180 },
          data: { operation: 'and' },
        },
        {
          id: 'lab-indicator',
          type: 'indicator',
          position: { x: 930, y: 180 },
          data: { label: 'Логическая лаборатория', mode: 'status', min: 0, max: 100 },
        },
      ],
      [
        { id: 'lab-a1-compare', source: 'lab-a1', target: 'lab-compare-1', sourceHandle: null, targetHandle: 'a' },
        { id: 'lab-b1-compare', source: 'lab-b1', target: 'lab-compare-1', sourceHandle: null, targetHandle: 'b' },
        { id: 'lab-a2-compare', source: 'lab-a2', target: 'lab-compare-2', sourceHandle: null, targetHandle: 'a' },
        { id: 'lab-b2-compare', source: 'lab-b2', target: 'lab-compare-2', sourceHandle: null, targetHandle: 'b' },
        { id: 'lab-compare-1-logic', source: 'lab-compare-1', target: 'lab-logic', sourceHandle: 'result', targetHandle: 'a' },
        { id: 'lab-compare-2-logic', source: 'lab-compare-2', target: 'lab-logic', sourceHandle: 'result', targetHandle: 'b' },
        { id: 'lab-logic-indicator', source: 'lab-logic', target: 'lab-indicator', sourceHandle: 'result', targetHandle: 'value' },
      ],
    ),
  },
  {
    id: 'calculation-machine',
    title: '🧮 Машина вычислений',
    description: 'Собери вычислительную цепочку и измени исходные числа.',
    graph: graph(
      [
        { id: 'calc-a', type: 'number', position: { x: 40, y: 40 }, data: { value: 15 } },
        { id: 'calc-b', type: 'number', position: { x: 40, y: 190 }, data: { value: 25 } },
        { id: 'calc-c', type: 'number', position: { x: 40, y: 340 }, data: { value: 10 } },
        {
          id: 'calc-math',
          type: 'math',
          position: { x: 340, y: 180 },
          data: { operation: 'add' },
        },
        {
          id: 'calc-indicator',
          type: 'indicator',
          position: { x: 650, y: 130 },
          data: { label: 'Сумма', mode: 'gauge', min: 0, max: 100 },
        },
      ],
      [
        { id: 'calc-a-math', source: 'calc-a', target: 'calc-math', sourceHandle: null, targetHandle: 'input' },
        { id: 'calc-b-math', source: 'calc-b', target: 'calc-math', sourceHandle: null, targetHandle: 'input' },
        { id: 'calc-c-math', source: 'calc-c', target: 'calc-math', sourceHandle: null, targetHandle: 'input' },
        { id: 'calc-math-indicator', source: 'calc-math', target: 'calc-indicator', sourceHandle: 'result', targetHandle: 'value' },
      ],
    ),
  },
]
