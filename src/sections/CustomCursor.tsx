import { useEffect, useRef } from 'react'

interface CustomCursorProps {
  awareness: number
  jiggleAmount: number
}

export default function CustomCursor({ awareness, jiggleAmount }: CustomCursorProps) {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Detect touch device — hide custom cursor
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) {
      document.body.style.cursor = 'auto'
      if (ringRef.current) ringRef.current.style.display = 'none'
      if (dotRef.current) dotRef.current.style.display = 'none'
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (ringRef.current) {
        ringRef.current.style.left = e.clientX + 'px'
        ringRef.current.style.top = e.clientY + 'px'
      }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top = e.clientY + 'px'
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Don't render on touch devices at all
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return null
  }

  let cursorClass = 'cursor-ring'
  if (jiggleAmount > 0.4) {
    cursorClass += ' startled'
  } else if (awareness > 0.5) {
    cursorClass += ' aware'
  }

  return (
    <>
      <div ref={ringRef} className={cursorClass} />
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}
