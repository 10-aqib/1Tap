// Global event system for triggering background pulses
export const triggerBackgroundPulse = (x?: number, y?: number) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('dropshare-bg-pulse', { detail: { x, y } })
    window.dispatchEvent(event)
  }
}
