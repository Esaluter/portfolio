import type { EvaluationErrorCode } from './evaluateGraph'

const messages: Record<EvaluationErrorCode, string> = {
  'division-by-zero': '🦝 Вселенная отказалась делиться на ноль.',
  cycle: '🦝 Енот бегает по кругу. Выход не найден.',
  'dependency-error': '⛏️ Предыдущий енот сломал вычисления.',
  'type-mismatch': '🦝 Еноту дали не ту деталь.',
  'invalid-random-range': '🎲 Енот перепутал границы случайности.',
  'invalid-indicator-range': '📏 Енот не смог разметить шкалу.',
  'indicator-mode-mismatch': '🦝 Енот не понял показания индикатора.',
  'invalid-number': '🦝 Енот нашёл число из другой вселенной.',
  'input-unavailable': '🦝 Енот не нашёл значение на входе.',
  'invalid-connection': '🦝 Детали соединены не по схеме.',
}

export const getUserErrorMessage = (code: string): string =>
  messages[code as EvaluationErrorCode] ??
  '🦝 Что-то пошло не по енотовому плану.'
