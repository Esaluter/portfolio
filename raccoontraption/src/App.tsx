import { useRef, useState, type ChangeEvent } from 'react'

import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Edge,
  type Connection,
  type NodeTypes,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import './App.css'

import NumberBlock from './nodes/NumberBlock'
import OutputBlock from './nodes/OutputBlock'
import MathBlock from './nodes/MathBlock'
import RandomBlock from './nodes/RandomBlock'
import CompareBlock from './nodes/CompareBlock'
import LogicBlock from './nodes/LogicBlock'
import IndicatorBlock from './nodes/IndicatorBlock'
import PreviewPanel from './preview/PreviewPanel'
import BlockCatalog from './components/BlockCatalog'
import DemoGallery from './components/DemoGallery'
import { findFreePosition } from './graph/findFreePosition'
import { evaluateGraph } from './engine/evaluateGraph'
import { getUserErrorMessage } from './engine/errorMessages'
import { isConnectionAllowed } from './engine/connectionRules'
import { clearEvaluationState } from './engine/clearEvaluationState'
import { createUniqueId } from './graph/createUniqueId'
import {
  createCompareNode,
  createIndicatorNode,
  createLogicNode,
  createMathNode,
  createNumberNode,
  createOutputNode,
  createRandomNode,
} from './graph/nodeFactories'
import type {
  CompareOperation,
  ContraptionNode,
  IndicatorSettings,
  LogicOperation,
  MathOperation,
} from './types'
import { deserializeGraph } from './persistence/deserializeGraph'
import { serializeGraphToJson } from './persistence/serializeGraph'
import { MAX_FILE_SIZE_BYTES } from './persistence/types'
import { demoExamples, type DemoExample } from './examples/demoGraphs'
import { prepareExampleLoad } from './examples/prepareExampleLoad'


const initialNodes: ContraptionNode[] = []

const initialEdges: Edge[] = []

const nodeTypes = {
  number: NumberBlock,
  math: MathBlock,
  output: OutputBlock,
  random: RandomBlock,
  compare: CompareBlock,
  logic: LogicBlock,
  indicator: IndicatorBlock,
} satisfies NodeTypes


type HistoryState = {
  nodes: ContraptionNode[]
  edges: Edge[]
}

type PersistenceStatus = {
  kind: 'success' | 'error'
  message: string
}


function App() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes)

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges)

  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus | null>(null)

  const [catalogCollapsed, setCatalogCollapsed] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fitViewRef = useRef<(() => void) | null>(null)


  // --------------------------------------------------
  // История Undo / Redo
  // --------------------------------------------------

  const undoStack =
    useRef<HistoryState[]>([])

  const redoStack =
    useRef<HistoryState[]>([])


  const cloneState = (): HistoryState => {
    return {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    }
  }


  const pushUndoState = (state: HistoryState) => {
    undoStack.current.push(
      structuredClone(state)
    )

    // Ограничиваем историю,
    // чтобы она не росла бесконечно
    if (undoStack.current.length > 100) {
      undoStack.current.shift()
    }

    // После нового действия Redo сбрасывается
    redoStack.current = []
    setCanUndo(true)
    setCanRedo(false)
  }


  const saveHistory = () => {
    pushUndoState(cloneState())
  }


  const undo = () => {
    const previousState =
      undoStack.current.pop()

    if (!previousState) {
      return
    }

    redoStack.current.push(
      cloneState()
    )

    setNodes(previousState.nodes)
    setEdges(previousState.edges)
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(true)
  }


  const redo = () => {
    const nextState =
      redoStack.current.pop()

    if (!nextState) {
      return
    }

    undoStack.current.push(
      cloneState()
    )

    setNodes(nextState.nodes)
    setEdges(nextState.edges)
    setCanUndo(true)
    setCanRedo(redoStack.current.length > 0)
  }


  // --------------------------------------------------
  // Изменение значений блоков
  // --------------------------------------------------

  const changeNumberValue = (
    id: string,
    value: number
  ) => {
    saveHistory()

    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.map((node) =>
        node.id === id &&
        node.type === 'number'
          ? {
              ...node,
              data: {
                ...node.data,
                value,
              },
            }
          : node
      ))
    )
  }


  const changeMathOperation = (
    id: string,
    operation: MathOperation
  ) => {
    saveHistory()

    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.map((node) =>
        node.id === id &&
        node.type === 'math'
          ? {
              ...node,
              data: {
                ...node.data,
                operation,
              },
            }
          : node
      ))
    )
  }


  const changeRandomRange = (
    id: string,
    min: number,
    max: number
  ) => {
    saveHistory()

    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.map((node) =>
        node.id === id &&
        node.type === 'random'
          ? {
              ...node,
              data: {
                ...node.data,
                min,
                max,
              },
            }
          : node
      ))
    )
  }


  const changeCompareOperation = (
    id: string,
    operation: CompareOperation
  ) => {
    saveHistory()

    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.map((node) =>
        node.id === id &&
        node.type === 'compare'
          ? {
              ...node,
              data: {
                ...node.data,
                operation,
              },
            }
          : node
      ))
    )
  }


  const changeLogicOperation = (
    id: string,
    operation: LogicOperation
  ) => {
    saveHistory()

    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.map((node) =>
        node.id === id &&
        node.type === 'logic'
          ? {
              ...node,
              data: {
                ...node.data,
                operation,
              },
            }
          : node
      ))
    )

    if (operation === 'not') {
      setEdges((currentEdges) =>
        currentEdges.filter((edge) =>
          edge.target !== id || edge.targetHandle !== 'b'
        )
      )
    }
  }


  const changeIndicatorSettings = (
    id: string,
    settings: IndicatorSettings,
  ) => {
    saveHistory()

    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.map((node) =>
        node.id === id && node.type === 'indicator'
          ? { ...node, data: { ...node.data, ...settings } }
          : node
      ))
    )
  }


  // --------------------------------------------------
  // Соединение блоков
  // --------------------------------------------------

  const onConnect = (
    connection: Connection
  ) => {
    if (!isConnectionAllowed(connection, nodes, edges)) {
      return
    }

    saveHistory()

    setNodes((currentNodes) => clearEvaluationState(currentNodes))

    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          id: createUniqueId(
            'edge',
            currentEdges.map((edge) => edge.id),
          ),
        },
        currentEdges
      )
    )
  }


  // --------------------------------------------------
  // Поиск свободного места
  // --------------------------------------------------

  // --------------------------------------------------
  // Создание блоков
  // --------------------------------------------------

  const addNumberBlock = () => {
    saveHistory()

    const newNode =
      createNumberNode(
        findFreePosition(nodes),
        nodes.map((node) => node.id),
      )


    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      newNode,
    ])
  }


  const addMathBlock = () => {
    saveHistory()

    const newNode =
      createMathNode(
        findFreePosition(nodes),
        nodes.map((node) => node.id),
      )


    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      newNode,
    ])
  }


  const addOutputBlock = () => {
    saveHistory()

    const newNode =
      createOutputNode(
        findFreePosition(nodes),
        nodes.map((node) => node.id),
      )


    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      newNode,
    ])
  }


  const addRandomBlock = () => {
    saveHistory()

    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      createRandomNode(
        findFreePosition(currentNodes),
        currentNodes.map((node) => node.id),
      ),
    ])
  }


  const addCompareBlock = () => {
    saveHistory()

    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      createCompareNode(
        findFreePosition(currentNodes),
        currentNodes.map((node) => node.id),
      ),
    ])
  }


  const addLogicBlock = () => {
    saveHistory()

    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      createLogicNode(
        findFreePosition(currentNodes),
        currentNodes.map((node) => node.id),
      ),
    ])
  }


  const addIndicatorBlock = () => {
    saveHistory()

    setNodes((currentNodes) => [
      ...clearEvaluationState(currentNodes),
      createIndicatorNode(
        findFreePosition(currentNodes),
        currentNodes.map((node) => node.id),
      ),
    ])
  }


  // --------------------------------------------------
  // Экспорт / импорт JSON
  // --------------------------------------------------

  const saveToFile = () => {
    const json = serializeGraphToJson(nodes, edges)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'raccoontraption.json'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)

    setPersistenceStatus({
      kind: 'success',
      message: '💾 Чертёж сохранён.',
    })
  }


  const openFileDialog = () => {
    fileInputRef.current?.click()
  }


  const loadFromFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget
    const file = input.files?.[0]

    // Позволяет повторно выбрать тот же файл.
    input.value = ''

    if (!file) {
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPersistenceStatus({
        kind: 'error',
        message: `🦝 Файл слишком велик. Максимум ${MAX_FILE_SIZE_BYTES} байт.`,
      })
      return
    }

    try {
      const result = deserializeGraph(await file.text())

      if (!result.ok) {
        setPersistenceStatus({
          kind: 'error',
          message: result.error.message,
        })
        return
      }

      // Импорт — одно атомарное действие истории.
      saveHistory()
      setNodes(result.graph.nodes)
      setEdges(result.graph.edges)
      setPersistenceStatus({
        kind: 'success',
        message: '📂 Чертёж загружен. Нажмите «Запустить» для вычисления.',
      })

      window.requestAnimationFrame(() => {
        fitViewRef.current?.()
      })
    } catch {
      setPersistenceStatus({
        kind: 'error',
        message: '🦝 Не удалось прочитать выбранный файл.',
      })
    }
  }


  const loadDemoExample = (example: DemoExample): boolean => {
    const result = prepareExampleLoad(example, { nodes, edges })

    if (!result.ok) {
      setPersistenceStatus({
        kind: 'error',
        message: result.error.message,
      })
      return false
    }

    pushUndoState(result.previous)
    setNodes(result.graph.nodes)
    setEdges(result.graph.edges)
    setGalleryOpen(false)
    setPersistenceStatus({
      kind: 'success',
      message: `🧪 Открыт пример «${example.title}». Нажмите «Запустить».`,
    })

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        fitViewRef.current?.()
      })
    })

    return true
  }


  // --------------------------------------------------
  // Удаление
  // --------------------------------------------------

  const deleteSelected = () => {
    const selectedNodeIds =
      new Set(
        nodes
          .filter(
            (node) =>
              node.selected
          )
          .map(
            (node) =>
              node.id
          )
      )


    const hasSelectedEdge =
      edges.some(
        (edge) =>
          edge.selected
      )


    if (
      selectedNodeIds.size === 0 &&
      !hasSelectedEdge
    ) {
      return
    }


    saveHistory()


    setNodes((currentNodes) =>
      clearEvaluationState(currentNodes.filter(
        (node) =>
          !selectedNodeIds.has(
            node.id
          )
      ))
    )


    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => {
          const selectedEdge =
            edge.selected


          const connectedToDeletedNode =
            selectedNodeIds.has(
              edge.source
            ) ||
            selectedNodeIds.has(
              edge.target
            )


          return (
            !selectedEdge &&
            !connectedToDeletedNode
          )
        }
      )
    )
  }


  // --------------------------------------------------
  // Перемещение блоков
  // --------------------------------------------------

  const onNodeDragStart = () => {
    // Запоминаем положение ДО начала движения.
    // Не записываем сотни промежуточных координат.
    saveHistory()
  }


  // --------------------------------------------------
  // Execution Engine
  // --------------------------------------------------

  const runContraption = () => {
    setNodes((currentNodes) => {
      const evaluation = evaluateGraph(currentNodes, edges)

      return currentNodes.map(
        (node) => {
          const evaluationError = evaluation.errors[node.id]
          const error = evaluationError
            ? getUserErrorMessage(evaluationError.code)
            : null

          return {
            ...node,
            data: {
              ...node.data,
              ...(node.type === 'number'
                ? {}
                : { value: evaluation.values[node.id] }),
              error,
              errorDetails: evaluationError?.message ?? null,
            },
          } as ContraptionNode
        }
      )
    })
  }


const handleKeyDown = (
  event: React.KeyboardEvent<HTMLDivElement>
) => {
  if (galleryOpen) {
    return
  }

  const target =
    event.target as HTMLElement

  const isEditing =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'

  const modifierPressed =
    event.ctrlKey || event.metaKey


  // Ctrl + Z
  if (
    modifierPressed &&
    !event.shiftKey &&
    event.code === 'KeyZ'
  ) {
    event.preventDefault()
    event.stopPropagation()

    undo()

    return
  }


  // Ctrl + Y
  if (
    modifierPressed &&
    event.code === 'KeyY'
  ) {
    event.preventDefault()
    event.stopPropagation()

    redo()

    return
  }


  // Ctrl + Shift + Z
  if (
    modifierPressed &&
    event.shiftKey &&
    event.code === 'KeyZ'
  ) {
    event.preventDefault()
    event.stopPropagation()

    redo()

    return
  }


  // Delete / Backspace
  if (
    !isEditing &&
    (
      event.key === 'Delete' ||
      event.key === 'Backspace'
    )
  ) {
    event.preventDefault()
    event.stopPropagation()

    deleteSelected()
  }
}

  // --------------------------------------------------
  // Интерфейс
  // --------------------------------------------------

  const hasSelection =
    nodes.some((node) => node.selected) ||
    edges.some((edge) => edge.selected)

  const blockCategories = [
    {
      name: 'Core',
      blocks: [
        { icon: '🔢', name: 'Число', description: 'Источник числового значения', onAdd: addNumberBlock },
        { icon: '📺', name: 'Вывод', description: 'Показывает итоговое значение', onAdd: addOutputBlock },
      ],
    },
    {
      name: 'Math',
      blocks: [
        { icon: '🧮', name: 'Математика', description: 'Выполняет арифметическую операцию', onAdd: addMathBlock },
        { icon: '🎲', name: 'Случайное', description: 'Генерирует число в диапазоне', onAdd: addRandomBlock },
      ],
    },
    {
      name: 'Logic',
      blocks: [
        { icon: '⚖️', name: 'Сравнение', description: 'Сравнивает два числа', onAdd: addCompareBlock },
        { icon: '🧠', name: 'Логика', description: 'Объединяет логические условия', onAdd: addLogicBlock },
      ],
    },
    {
      name: 'Visual',
      blocks: [
        { icon: '🚦', name: 'Индикатор', description: 'Показывает статус или шкалу', onAdd: addIndicatorBlock },
      ],
    },
  ]

  return (
    <div
      className="app"
      onKeyDownCapture={handleKeyDown}
    >

      <header className="topbar">
        <div className="topbar__brand">
          <strong>🦝 Raccoontraption</strong>
          <span>Первый проект</span>
        </div>

        <nav className="topbar__actions" aria-label="Действия редактора">
          <div className="toolbar-group">
            <button
              className="button-primary"
              onClick={runContraption}
              disabled={nodes.length === 0}
              title="Выполнить конструкцию"
            >
              ▶ Запустить
            </button>
          </div>

          <div className="toolbar-group">
            <button onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
              ↶ Отменить
            </button>
            <button onClick={redo} disabled={!canRedo} title="Вернуть (Ctrl+Y)">
              ↷ Вернуть
            </button>
          </div>

          <div className="toolbar-group">
            <button onClick={saveToFile} title="Скачать конструкцию в JSON">
              💾 Сохранить
            </button>
            <button onClick={openFileDialog} title="Загрузить конструкцию из JSON">
              📂 Загрузить
            </button>
            <button onClick={() => setGalleryOpen(true)} title="Открыть готовые эксперименты">
              🧪 Примеры
            </button>
          </div>

          <div className="toolbar-group">
            <button onClick={deleteSelected} disabled={!hasSelection} title="Удалить выбранное (Delete)">
              🗑 Удалить
            </button>
          </div>
        </nav>


        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={loadFromFile}
          hidden
        />


        {persistenceStatus && (
          <span
            className={`persistence-status persistence-status--${persistenceStatus.kind}`}
            role="status"
          >
            {persistenceStatus.message}
          </span>
        )}

      </header>


      <div className="workspace">

      <BlockCatalog
        collapsed={catalogCollapsed}
        onToggle={() => setCatalogCollapsed((value) => !value)}
        categories={blockCategories}
      />

      <div className="canvas">

        {nodes.length === 0 && (
          <div className="canvas-empty">
            <strong>🦝 Здесь пока тихо.</strong>
            <span>Добавь блок или открой готовый эксперимент.</span>
            <div className="button-row">
              <button type="button" onClick={() => setGalleryOpen(true)}>
                Открыть примеры
              </button>
              <button type="button" className="button-secondary" onClick={addNumberBlock}>
                Добавить число
              </button>
            </div>
          </div>
        )}

        <ReactFlow

          nodes={nodes.map(
            (node) => {

              if (
                node.type === 'number'
              ) {
                return {
                  ...node,

                  data: {
                    ...node.data,

                    onChange:
                      changeNumberValue,
                  },
                }
              }


              if (
                node.type === 'math'
              ) {
                return {
                  ...node,

                  data: {
                    ...node.data,

                    onOperationChange:
                      changeMathOperation,
                  },
                }
              }


              if (
                node.type === 'random'
              ) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    onRangeChange:
                      changeRandomRange,
                  },
                }
              }


              if (
                node.type === 'compare'
              ) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    onOperationChange:
                      changeCompareOperation,
                  },
                }
              }


              if (
                node.type === 'logic'
              ) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    onOperationChange:
                      changeLogicOperation,
                  },
                }
              }


              if (
                node.type === 'indicator'
              ) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    onSettingsChange:
                      changeIndicatorSettings,
                  },
                }
              }


              return node
            }
          )}


          edges={edges}

          nodeTypes={nodeTypes}

          onInit={(instance) => {
            fitViewRef.current = () => {
              void instance.fitView()
            }
          }}

          onNodesChange={
            onNodesChange
          }

          onEdgesChange={
            onEdgesChange
          }

          onConnect={
            onConnect
          }

          isValidConnection={(connection) =>
            isConnectionAllowed(connection, nodes, edges)
          }

          onNodeDragStart={
            onNodeDragStart
          }

          // Удаление теперь контролируем сами,
          // чтобы оно попадало в историю.
          deleteKeyCode={null}

          fitView
        >

          <Background />

          <Controls />

        </ReactFlow>

      </div>

      <PreviewPanel nodes={nodes} />

      </div>

      {galleryOpen && (
        <DemoGallery
          examples={demoExamples}
          hasGraph={nodes.length > 0 || edges.length > 0}
          onClose={() => setGalleryOpen(false)}
          onSelect={loadDemoExample}
        />
      )}

    </div>
  )
}


export default App
