import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import { ACTIONS, initialState, collaborationReducer, COLLABORATION_MODES } from '../reducers/collaborationReducer.js'
import { useAuth } from './AuthContext.jsx'
import io from 'socket.io-client'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const SOCKET_URL = API_BASE

const CollaborationContext = createContext()

export function CollaborationProvider({ children }) {
  const [state, dispatch] = useReducer(collaborationReducer, initialState)
  const socketRef = useRef(null)
  const boardSlugRef = useRef('default')
  const { user } = useAuth()

  useEffect(() => {
    // Initialize socket connection (allow fallback polling)
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.emit('join', boardSlugRef.current)

    socket.on('stroke:added', (stroke) => {
      dispatch({ type: ACTIONS.ADD_STROKE, payload: stroke })
    })
    socket.on('canvas:cleared', () => {
      dispatch({ type: ACTIONS.CLEAR_CANVAS })
    })
    socket.on('cursor:updated', (user) => {
      dispatch({ type: ACTIONS.UPDATE_USER_CURSOR, payload: { userId: user.id, position: user.cursor } })
    })
    socket.on('layer:locked', (locked) => {
      if (locked !== state.isLayerLocked) {
        dispatch({ type: ACTIONS.TOGGLE_LAYER_LOCK })
      }
    })
    socket.on('mode:updated', (mode) => {
      dispatch({ type: ACTIONS.SET_COLLABORATION_MODE, payload: mode })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Load board from backend on mount
  useEffect(() => {
    const load = async () => {
      try {
        const slug = boardSlugRef.current
        const res = await fetch(`${API_BASE}/api/boards/${slug}`)
        if (res.status === 404) {
          await fetch(`${API_BASE}/api/boards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, title: 'Default Board' })
          })
          return load()
        }
        const data = await res.json()
        if (Array.isArray(data.strokes)) {
          // Replace local strokes with server data
          data.strokes.forEach(stroke => {
            dispatch({ type: ACTIONS.ADD_STROKE, payload: stroke })
          })
        }
        if (typeof data.isLayerLocked === 'boolean' && data.isLayerLocked !== initialState.isLayerLocked) {
          if (data.isLayerLocked !== state.isLayerLocked) {
            dispatch({ type: ACTIONS.TOGGLE_LAYER_LOCK })
          }
        }
        if (data.collaborationMode) {
          dispatch({ type: ACTIONS.SET_COLLABORATION_MODE, payload: data.collaborationMode })
        }
        // Load board users
        const usersRes = await fetch(`${API_BASE}/api/users/boards/${slug}`)
        if (usersRes.ok) {
          const users = await usersRes.json()
          const mapped = users.map(u => ({ id: u._id, name: u.name, color: u.color, isActive: true, cursor: { x: 0, y: 0 } }))
          if (user) {
            const me = { id: user.id, name: user.name, color: user.color || '#3b82f6', isActive: true, cursor: { x: 0, y: 0 } }
            const withoutDup = mapped.filter(m => m.id !== me.id)
            dispatch({ type: ACTIONS.SET_USERS, payload: [me, ...withoutDup] })
          } else {
            dispatch({ type: ACTIONS.SET_USERS, payload: mapped })
          }
        }
      } catch (e) {
        console.error('Failed to load board', e)
      }
    }
    load()
  }, [])

  // Add current user to board collaborators when available
  useEffect(() => {
    const add = async () => {
      if (!user) return
      try {
        await fetch(`${API_BASE}/api/users/boards/${boardSlugRef.current}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
      } catch {}
    }
    add()
  }, [user])

  const api = {
    emitStroke: async (stroke) => {
      socketRef.current?.emit('stroke:add', { room: boardSlugRef.current, stroke })
      try {
        await fetch(`${API_BASE}/api/boards/${boardSlugRef.current}/strokes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stroke })
        })
      } catch {}
    },
    clearCanvas: async () => {
      socketRef.current?.emit('canvas:clear', boardSlugRef.current)
      try {
        await fetch(`${API_BASE}/api/boards/${boardSlugRef.current}/clear`, { method: 'POST' })
      } catch {}
    },
    updateCursor: (user) => {
      socketRef.current?.emit('cursor:update', { room: boardSlugRef.current, user })
    },
    setLocked: async (locked) => {
      socketRef.current?.emit('layer:lock', { room: boardSlugRef.current, locked })
      try {
        await fetch(`${API_BASE}/api/boards/${boardSlugRef.current}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isLayerLocked: locked })
        })
      } catch {}
    },
    setMode: async (mode) => {
      socketRef.current?.emit('mode:set', { room: boardSlugRef.current, mode })
      try {
        await fetch(`${API_BASE}/api/boards/${boardSlugRef.current}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collaborationMode: mode })
        })
      } catch {}
    }
  }
  return (
    <CollaborationContext.Provider value={{ state, dispatch, api }}>
      {children}
    </CollaborationContext.Provider>
  )
}

export function useCollaboration() {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider')
  }
  return context
}

// Re-export ACTIONS and COLLABORATION_MODES for convenience
export { ACTIONS, COLLABORATION_MODES }



