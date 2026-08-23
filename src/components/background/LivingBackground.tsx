import { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  pulse: number
}

interface PulseEvent {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
}

// Global event system for triggering background pulses
export const triggerBackgroundPulse = (x?: number, y?: number) => {
  const event = new CustomEvent('dropshare-bg-pulse', { detail: { x, y } })
  window.dispatchEvent(event)
}

export function LivingBackground({ active = false }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let points: Point[] = []
    let pulses: PulseEvent[] = []
    let animationFrame: number
    let width = 0
    let height = 0
    let mouse = { x: -1000, y: -1000, moving: false }
    let lastMouseTime = 0
    
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const init = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      
      const pointCount = Math.min(Math.floor((width * height) / 25000), 50)
      points = []
      
      for (let i = 0; i < pointCount; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          pulse: 0
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      
      const isDark = document.documentElement.classList.contains('dark')
      
      // Theme colors
      const accentColorRGB = isDark ? '59, 130, 246' : '37, 99, 235' // blue-500 : blue-600
      const dotColor = isDark ? `rgba(255, 255, 255, 0.15)` : `rgba(0, 0, 0, 0.1)`
      const lineColor = isDark ? `rgba(255, 255, 255, 0.04)` : `rgba(0, 0, 0, 0.03)`
      const cursorGlow = `rgba(${accentColorRGB}, 0.03)`

      // Global activity speed modifier
      const speedMult = prefersReducedMotion ? 0 : (active ? 1.5 : 0.5)
      const connectDist = active ? 200 : 150

      // Update and draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]
        p.radius += 2
        p.life -= 0.02
        if (p.life <= 0) {
          pulses.splice(i, 1)
          continue
        }
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${accentColorRGB}, ${p.life * 0.2})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Draw mouse glow
      if (!prefersReducedMotion && Date.now() - lastMouseTime < 2000) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300)
        gradient.addColorStop(0, cursorGlow)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }

      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        
        // Move
        p.x += p.vx * speedMult
        p.y += p.vy * speedMult
        
        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Mouse interaction (gentle repel)
        if (!prefersReducedMotion) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            p.x -= (dx / dist) * 0.5
            p.y -= (dy / dist) * 0.5
          }
        }

        // Draw dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius + p.pulse, 0, Math.PI * 2)
        ctx.fillStyle = dotColor
        ctx.fill()
        
        // Return pulse to normal
        if (p.pulse > 0) p.pulse -= 0.1

        // Connect
        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < connectDist) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            const opacity = (1 - dist / connectDist)
            ctx.strokeStyle = p.pulse > 0 || p2.pulse > 0 ? `rgba(${accentColorRGB}, ${opacity * 0.3})` : lineColor
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      animationFrame = requestAnimationFrame(draw)
    }

    init()
    if (!prefersReducedMotion) {
      draw()
    } else {
      // Draw once for static background
      draw()
    }

    const handleResize = () => init()
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      lastMouseTime = Date.now()
    }
    
    const handleMouseClick = (e: MouseEvent) => {
      // Add a subtle click pulse
      pulses.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 100, life: 1 })
    }

    const handleCustomPulse = (e: Event) => {
      const customEvent = e as CustomEvent
      const x = customEvent.detail?.x ?? width / 2
      const y = customEvent.detail?.y ?? height / 2
      pulses.push({ x, y, radius: 0, maxRadius: 150, life: 1 })
      
      // Randomly excite some points
      points.forEach(p => {
        if (Math.random() > 0.8) p.pulse = 2
      })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleMouseClick, { passive: true })
    window.addEventListener('dropshare-bg-pulse', handleCustomPulse)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleMouseClick)
      window.removeEventListener('dropshare-bg-pulse', handleCustomPulse)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-1000"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  )
}
