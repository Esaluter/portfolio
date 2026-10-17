import type { NodeProps } from '@xyflow/react'

import type { CompareNode, CompareOperation } from '../types'
import NodeError from './NodeError'
import PortRow from './PortRow'

function CompareBlock({ id, data }: NodeProps<CompareNode>) {
  const changeOperation = data.onOperationChange!

  return (
    <div className="typed-node typed-node--compare">
      <strong>⚖️ Сравнение</strong>

      <div className="typed-node__operation">
        <label htmlFor={`compare-operation-${id}`}>Операция</label>
        <select
          id={`compare-operation-${id}`}
          value={data.operation}
          onChange={(event) =>
            changeOperation(id, event.target.value as CompareOperation)
          }
          className="nodrag nowheel"
        >
          <option value="greater">A &gt; B</option>
          <option value="less">A &lt; B</option>
          <option value="greater-or-equal">A ≥ B</option>
          <option value="less-or-equal">A ≤ B</option>
          <option value="equal">A == B</option>
          <option value="not-equal">A != B</option>
        </select>
      </div>

      <div className="typed-node__ports" aria-label="Входы сравнения">
        <PortRow id="a" type="target" label="A · число" color="#06b6d4" />
        <PortRow id="b" type="target" label="B · число" color="#06b6d4" />
      </div>

      <div className="typed-node__result">
        Результат: {String(data.error ? '—' : (data.value ?? '—'))}
      </div>

      <div className="typed-node__ports typed-node__ports--output">
        <PortRow
          id="result"
          type="source"
          label="boolean · выход"
          color="#06b6d4"
        />
      </div>

      <NodeError
        message={data.error}
        details={data.errorDetails}
      />
    </div>
  )
}

export default CompareBlock
