import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { MathNode, MathOperation } from '../types'
import NodeError from './NodeError'

function MathBlock({ id, data }: NodeProps<MathNode>) {
  const operation = data.operation ?? 'add'

  const changeOperation = (newOperation: MathOperation) => {
    if (typeof data.onOperationChange === 'function') {
      data.onOperationChange(id, newOperation)
    }
  }

  return (
    <div
      style={{
        background: '#182231',
        color: 'white',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '180px',
        position: 'relative',
      }}
    >
      <strong>🧮 Математика</strong>

      <div style={{ marginTop: '10px' }}>
        <select
          value={operation}
          onChange={(event) =>
            changeOperation(event.target.value as MathOperation)
          }
          className="nodrag"
        >
          <option value="add">➕ Сложение</option>
          <option value="subtract">➖ Вычитание</option>
          <option value="multiply">✖ Умножение</option>
          <option value="divide">➗ Деление</option>
        </select>
      </div>

      <div style={{ marginTop: '10px' }}>
        Результат: {String(data.error ? '—' : (data.value ?? '—'))}
      </div>

      <NodeError
        message={data.error}
        details={data.errorDetails}
      />

      <Handle
        id="input"
        type="target"
        position={Position.Left}
      />

      <Handle
        id="result"
        type="source"
        position={Position.Right}
      />
    </div>
  )
}

export default MathBlock
