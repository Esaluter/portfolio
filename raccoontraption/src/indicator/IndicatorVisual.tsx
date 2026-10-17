import type { IndicatorPresentation } from './getIndicatorPresentation'

type IndicatorVisualProps = {
  presentation: IndicatorPresentation
}

function IndicatorVisual({ presentation }: IndicatorVisualProps) {
  if (presentation.kind === 'empty') {
    return <div className="indicator-empty">{presentation.text}</div>
  }

  if (presentation.kind === 'error') {
    return (
      <div className="indicator-error" title={presentation.details ?? undefined}>
        {presentation.text}
      </div>
    )
  }

  if (presentation.kind === 'status') {
    return (
      <div
        className={`indicator-status indicator-status--${presentation.active ? 'true' : 'false'}`}
      >
        <span className="indicator-status__light" aria-hidden="true" />
        <span>{presentation.text}</span>
      </div>
    )
  }

  return (
    <div className="indicator-gauge">
      <strong>{presentation.value}</strong>
      <div
        className="indicator-gauge__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={presentation.percent}
      >
        <div
          className="indicator-gauge__fill"
          style={{ width: `${presentation.percent}%` }}
        />
      </div>
      <span>{presentation.rangeLabel}</span>
    </div>
  )
}

export default IndicatorVisual
