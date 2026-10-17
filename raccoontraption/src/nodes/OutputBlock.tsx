import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { OutputNode } from '../types'
import NodeError from './NodeError'

function OutputBlock({ data }: NodeProps<OutputNode>) {
  return (
    <div
      style={{
        background: '#182231',
        color: 'white',
        border: '1px solid #8b5cf6',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '160px',
      }}
    >
      <strong>📺 Вывод</strong>

      <div style={{ marginTop: '10px' }}>
        Получено: {String(data.error ? '—' : (data.value ?? '—'))}
      </div>

      <NodeError
        message={data.error}
        details={data.errorDetails}
      />

      <Handle
        type="target"
        position={Position.Left}
      />
    </div>
  )
}

export default OutputBlock
