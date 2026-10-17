import { useEffect } from 'react'
import { type NodeProps, useUpdateNodeInternals } from '@xyflow/react'

import type { LogicNode, LogicOperation } from '../types'
import NodeError from './NodeError'
import PortRow from './PortRow'

function LogicBlock({ id, data }: NodeProps<LogicNode>) {
  const changeOperation = data.onOperationChange!
  const usesInputB = data.operation !== 'not'
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, updateNodeInternals, usesInputB])

  return (
    <div className="typed-node typed-node--logic">
      <strong>🧠 Логика</strong>

      <div className="typed-node__operation">
        <label htmlFor={`logic-operation-${id}`}>Операция</label>
        <select
          id={`logic-operation-${id}`}
          value={data.operation}
          onChange={(event) =>
            changeOperation(id, event.target.value as LogicOperation)
          }
          className="nodrag nowheel"
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="not">NOT</option>
          <option value="xor">XOR</option>
        </select>
      </div>

      <div className="typed-node__ports" aria-label="Входы логики">
        <PortRow id="a" type="target" label="A · boolean" color="#ec4899" />
        {usesInputB && (
          <PortRow id="b" type="target" label="B · boolean" color="#ec4899" />
        )}
      </div>

      <div className="typed-node__result">
        Результат: {String(data.error ? '—' : (data.value ?? '—'))}
      </div>

      <div className="typed-node__ports typed-node__ports--output">
        <PortRow
          id="result"
          type="source"
          label="boolean · выход"
          color="#ec4899"
        />
      </div>

      <NodeError
        message={data.error}
        details={data.errorDetails}
      />
    </div>
  )
}

export default LogicBlock
