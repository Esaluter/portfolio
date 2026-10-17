import { useEffect, useState } from 'react'

import type { DemoExample } from '../examples/demoGraphs'

type DemoGalleryProps = {
  examples: readonly DemoExample[]
  hasGraph: boolean
  onClose: () => void
  onSelect: (example: DemoExample) => boolean
}

function DemoGallery({ examples, hasGraph, onClose, onSelect }: DemoGalleryProps) {
  const [pending, setPending] = useState<DemoExample | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const selectExample = (example: DemoExample) => {
    setLoadFailed(false)

    if (hasGraph) {
      setPending(example)
      return
    }

    setLoadFailed(!onSelect(example))
  }

  const confirmReplacement = () => {
    if (!pending) return
    setLoadFailed(!onSelect(pending))
  }

  return (
    <div className="gallery-backdrop" onMouseDown={onClose}>
      <section
        className="demo-gallery"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-gallery-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="demo-gallery__header">
          <div>
            <span>Готовые эксперименты</span>
            <h2 id="demo-gallery-title">🧪 Примеры</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Закрыть галерею"
            title="Закрыть галерею"
          >
            ✕
          </button>
        </header>

        {pending ? (
          <div className="demo-gallery__confirmation">
            <strong>Заменить текущую конструкцию?</strong>
            <p>
              Будет открыт пример «{pending.title}». Текущий граф можно вернуть кнопкой Undo.
            </p>
            <div className="button-row">
              <button type="button" autoFocus onClick={confirmReplacement}>
                Заменить и открыть
              </button>
              <button type="button" className="button-secondary" onClick={() => setPending(null)}>
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="demo-gallery__grid">
            {examples.map((example) => (
              <button
                className="demo-card"
                type="button"
                key={example.id}
                onClick={() => selectExample(example)}
              >
                <strong>{example.title}</strong>
                <span>{example.description}</span>
                <small>
                  {example.graph.nodes.length} блоков · {example.graph.edges.length} связей
                </small>
              </button>
            ))}
          </div>
        )}

        {loadFailed && (
          <div className="demo-gallery__error" role="alert">
            🦝 Не удалось открыть пример. Текущая конструкция сохранена.
          </div>
        )}
      </section>
    </div>
  )
}

export default DemoGallery
