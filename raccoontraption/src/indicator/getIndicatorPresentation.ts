import type { GraphValue, IndicatorMode } from '../types'

type IndicatorPresentationInput = {
  mode: IndicatorMode
  min: number
  max: number
  value: GraphValue | null
  error: string | null
  errorDetails: string | null
}

export type IndicatorPresentation =
  | { kind: 'empty'; text: string }
  | { kind: 'error'; text: string; details: string | null }
  | { kind: 'status'; text: string; active: boolean }
  | {
      kind: 'gauge'
      value: number
      percent: number
      rangeLabel: string
    }

const errorPresentation = (
  text: string,
  details: string | null = null,
): IndicatorPresentation => ({ kind: 'error', text, details })

export const getIndicatorPresentation = (
  input: IndicatorPresentationInput,
): IndicatorPresentation => {
  if (input.error) {
    return errorPresentation(input.error, input.errorDetails)
  }

  if (input.value === null) {
    return { kind: 'empty', text: '⛏️ Енот ждёт сигнал.' }
  }

  const effectiveMode = input.mode === 'auto'
    ? typeof input.value === 'boolean' ? 'status' : 'gauge'
    : input.mode

  if (effectiveMode === 'status') {
    if (typeof input.value !== 'boolean') {
      return errorPresentation('🦝 Енот не понял показания индикатора.')
    }

    return {
      kind: 'status',
      active: input.value,
      text: input.value
        ? '🦝 ЕНОТ ОДОБРЯЕТ'
        : '🦝 ЕНОТ НЕ ОДОБРЯЕТ',
    }
  }

  if (typeof input.value !== 'number') {
    return errorPresentation('🦝 Енот не понял показания индикатора.')
  }

  if (
    !Number.isFinite(input.min) ||
    !Number.isFinite(input.max) ||
    input.min >= input.max
  ) {
    return errorPresentation('📏 Енот не смог разметить шкалу.')
  }

  const rawPercent = ((input.value - input.min) / (input.max - input.min)) * 100

  return {
    kind: 'gauge',
    value: input.value,
    percent: Math.min(100, Math.max(0, rawPercent)),
    rangeLabel: `${input.min} — ${input.max}`,
  }
}
