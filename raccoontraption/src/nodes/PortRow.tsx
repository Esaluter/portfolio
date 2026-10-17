import { Handle, Position } from '@xyflow/react'

type PortRowProps = {
  id: string
  type: 'source' | 'target'
  label: string
  color: string
}

function PortRow({ id, type, label, color }: PortRowProps) {
  const isSource = type === 'source'

  return (
    <div
      className={`typed-port-row ${isSource ? 'typed-port-row--source' : ''}`}
    >
      <span>{label}</span>
      <Handle
        id={id}
        type={type}
        position={isSource ? Position.Right : Position.Left}
        className="typed-port-handle"
        style={{ background: color }}
      />
    </div>
  )
}

export default PortRow
