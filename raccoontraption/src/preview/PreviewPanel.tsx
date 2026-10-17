import { useState } from 'react'

import { getIndicatorPresentation } from '../indicator/getIndicatorPresentation'
import IndicatorVisual from '../indicator/IndicatorVisual'
import type { ContraptionNode, IndicatorNode } from '../types'

type PreviewPanelProps = {
  nodes: readonly ContraptionNode[]
}

const isIndicator = (node: ContraptionNode): node is IndicatorNode =>
  node.type === 'indicator'

function PreviewPanel({ nodes }: PreviewPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const indicators = nodes.filter(isIndicator)

  return (
    <aside className={`preview-panel ${collapsed ? 'preview-panel--collapsed' : ''}`}>
      <div className="preview-panel__header">
        {!collapsed && <strong>👁 Preview</strong>}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Развернуть Preview' : 'Свернуть Preview'}
          title={collapsed ? 'Развернуть Preview' : 'Свернуть Preview'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
      </div>

      {!collapsed && (
        <div className="preview-panel__content">
          {indicators.length === 0 ? (
            <div className="preview-panel__empty">
              🦝 Добавьте Indicator, чтобы увидеть результат.
            </div>
          ) : indicators.map((indicator) => (
            <section className="preview-card" key={indicator.id}>
              <strong>{indicator.data.label || 'Без названия'}</strong>
              <IndicatorVisual
                presentation={getIndicatorPresentation(indicator.data)}
              />
            </section>
          ))}
        </div>
      )}
    </aside>
  )
}

export default PreviewPanel
