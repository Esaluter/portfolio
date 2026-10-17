import type { NodeProps } from '@xyflow/react'

import { getIndicatorPresentation } from '../indicator/getIndicatorPresentation'
import IndicatorVisual from '../indicator/IndicatorVisual'
import type {
  IndicatorMode,
  IndicatorNode,
  IndicatorSettings,
} from '../types'
import PortRow from './PortRow'

function IndicatorBlock({ id, data }: NodeProps<IndicatorNode>) {
  const changeSettings = data.onSettingsChange!

  const update = (patch: Partial<IndicatorSettings>) => {
    changeSettings(id, {
      label: data.label,
      mode: data.mode,
      min: data.min,
      max: data.max,
      ...patch,
    })
  }

  return (
    <div className="typed-node typed-node--indicator">
      <strong>🚦 Индикатор</strong>

      <div className="indicator-settings">
        <label htmlFor={`indicator-label-${id}`}>Название</label>
        <input
          id={`indicator-label-${id}`}
          value={data.label}
          maxLength={60}
          onChange={(event) => update({ label: event.target.value })}
          className="nodrag nowheel"
        />

        <label htmlFor={`indicator-mode-${id}`}>Режим</label>
        <select
          id={`indicator-mode-${id}`}
          value={data.mode}
          onChange={(event) => update({ mode: event.target.value as IndicatorMode })}
          className="nodrag nowheel"
        >
          <option value="auto">AUTO</option>
          <option value="status">STATUS</option>
          <option value="gauge">GAUGE</option>
        </select>

        {data.mode !== 'status' && (
          <div className="indicator-range">
            <label>
              Min
              <input
                type="number"
                value={data.min}
                onChange={(event) => update({ min: Number(event.target.value) })}
                className="nodrag nowheel"
              />
            </label>
            <label>
              Max
              <input
                type="number"
                value={data.max}
                onChange={(event) => update({ max: Number(event.target.value) })}
                className="nodrag nowheel"
              />
            </label>
          </div>
        )}
      </div>

      <div className="typed-node__ports" aria-label="Вход индикатора">
        <PortRow id="value" type="target" label="value · number | boolean" color="#f97316" />
      </div>

      <IndicatorVisual presentation={getIndicatorPresentation(data)} />
    </div>
  )
}

export default IndicatorBlock
