import React, { useEffect, useRef, useState } from 'react'
import { ACTIONS, useCollaboration } from '../context/CollaborationContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function DrawingCanvas() {
  const { state, dispatch, api } = useCollaboration()
  const { user } = useAuth()
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState(null)

  // Redraw canvas whenever strokes change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    state.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      ctx.globalCompositeOperation = stroke.tool === 'erase' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })
  }, [state.strokes])

  const getEventPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX)
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY)
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    
    if (state.isLayerLocked) {
      console.log('Drawing blocked: Layer is locked')
      return
    }
    
    if (!user) return
    
    setIsDrawing(true)
    const pos = getEventPos(e)
    const newStroke = {
      id: `${Date.now()}-${Math.random()}`,
      tool: state.currentTool,
      color: state.currentColor,
      size: state.currentSize,
      points: [pos],
      userId: user.id
    }
    setCurrentStroke(newStroke)
    
    // Add locally first for immediate feedback
    dispatch({ type: ACTIONS.ADD_STROKE, payload: newStroke })
    dispatch({ type: ACTIONS.SET_IS_DRAWING, payload: true })
  }

  const draw = (e) => {
    if (!isDrawing || !currentStroke) return
    
    if (state.isLayerLocked) {
      stopDrawing()
      return
    }
    
    e.preventDefault()
    const pos = getEventPos(e)
    
    // Update cursor position
    api.updateCursor(pos)
    
    const updatedStroke = { ...currentStroke, points: [...currentStroke.points, pos] }
    setCurrentStroke(updatedStroke)

    // Update the last stroke in state
    const updatedStrokes = [...state.strokes]
    const lastIndex = updatedStrokes.length - 1
    if (lastIndex >= 0) {
      updatedStrokes[lastIndex] = updatedStroke
      
      // Clear and redraw
      dispatch({ type: ACTIONS.CLEAR_CANVAS })
      updatedStrokes.forEach(stroke => {
        dispatch({ type: ACTIONS.ADD_STROKE, payload: stroke })
      })
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return
    
    // Emit final stroke to other users
    api.emitStroke(currentStroke)
    
    setIsDrawing(false)
    setCurrentStroke(null)
    dispatch({ type: ACTIONS.SET_IS_DRAWING, payload: false })
  }

  const handleMouseMove = (e) => {
    if (!isDrawing && user) {
      const pos = getEventPos(e)
      api.updateCursor(pos)
    }
  }

  const isDrawingBlocked = state.isLayerLocked
  
  return (
    <div className="relative" style={{ position: "relative", zIndex: "1" }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-600 ${
          isDrawingBlocked 
            ? 'cursor-not-allowed opacity-75' 
            : 'cursor-crosshair hover:shadow-3xl'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={(e) => { draw(e); handleMouseMove(e) }}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {state.isDrawing && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          Drawing...
        </div>
      )}

      {isDrawingBlocked && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          🔒 Layer Locked
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/70 dark:bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        {state.strokes.length} stroke{state.strokes.length !== 1 ? 's' : ''}
      </div>

      {/* Show other users' cursors */}
      {state.users
        .filter(u => u.socketId && u.userId !== user?.id)
        .map(u => (
          <div
            key={u.socketId}
            className="absolute w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-lg pointer-events-none z-10 transition-all duration-200"
            style={{
              backgroundColor: u.color,
              left: u.cursor.x + 'px',
              top: u.cursor.y + 'px',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="absolute top-4 left-0 bg-gray-800 dark:bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
              {u.name}
            </div>
          </div>
        ))}
    </div>
  )
}