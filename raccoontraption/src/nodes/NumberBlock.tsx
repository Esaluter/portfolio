import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NumberNode } from '../types'
import NodeError from './NodeError'

function NumberBlock({ id, data }: NodeProps<NumberNode>) {
  const changeValue = data.onChange!

  return (
    <div
      style={{
        background: '#182231',
        color: 'white',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '160px',
      }}
    >
      <strong>🔢 Число</strong>

      <div style={{ marginTop: '10px' }}>
        Значение:{' '}

        <input
          type="number"
          value={Number(data.value)}
          onChange={(event) =>
            changeValue(id, Number(event.target.value))
          }
          className="nodrag"
          style={{
            width: '80px',
            marginLeft: '6px',
          }}
        />
      </div>

      <NodeError
        message={data.error}
        details={data.errorDetails}
      />

      <Handle
        type="source"
        position={Position.Right}
      />
    </div>
  )
}

export default NumberBlock
