import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { RandomNode } from '../types'
import NodeError from './NodeError'

function RandomBlock({ id, data }: NodeProps<RandomNode>) {
  const changeRange = data.onRangeChange!

  return (
    <div
      style={{
        background: '#182231',
        color: 'white',
        border: '1px solid #22c55e',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '190px',
      }}
    >
      <strong>🎲 Случайное число</strong>

      <div style={{ marginTop: '10px' }}>
        Min:{' '}
        <input
          type="number"
          value={data.min}
          onChange={(event) =>
            changeRange(id, Number(event.target.value), data.max)
          }
          className="nodrag"
          style={{ width: '65px' }}
        />
      </div>

      <div style={{ marginTop: '6px' }}>
        Max:{' '}
        <input
          type="number"
          value={data.max}
          onChange={(event) =>
            changeRange(id, data.min, Number(event.target.value))
          }
          className="nodrag"
          style={{ width: '65px' }}
        />
      </div>

      <div style={{ marginTop: '10px' }}>
        Результат: {String(data.error ? '—' : (data.value ?? '—'))}
      </div>

      <NodeError
        message={data.error}
        details={data.errorDetails}
      />

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default RandomBlock
