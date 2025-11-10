import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react'
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
  const { user, setOnlineUsers } = useAuth()
  const [onlineUsersInRoom, setOnlineUsersInRoom] = useState([])

  // Socket connection with user authentication
  useEffect(() => {
    if (!user) return

    const socket = io(SOCKET_URL, { 
      transports: ['websocket', 'polling'],
      reconnection: true
    })
    
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      // Join room with user info
      socket.emit('join', { 
        room: boardSlugRef.current,
        userId: user.id,
        userName: user.name,
        userColor: user.color || '#3b82f6'
      })
    })

    // Listen for global online users count
    socket.on('online:count', (count) => {
      console.log('Online users count:', count)
      setOnlineUsers(count)
    })

    // Receive initial users list
    socket.on('users:list', (users) => {
      console.log('Received users list:', users)
      setOnlineUsersInRoom(users)
      dispatch({ type: ACTIONS.SET_USERS, payload: users })
    })

    // New user joined
    socket.on('user:joined', (newUser) => {
      console.log('User joined:', newUser)
      setOnlineUsersInRoom(prev => {
        const exists = prev.find(u => u.socketId === newUser.socketId)
        if (exists) return prev
        return [...prev, { ...newUser, isActive: true }]
      })
    })

    // User left
    socket.on('user:left', (socketId) => {
      console.log('User left:', socketId)
      setOnlineUsersInRoom(prev => prev.filter(u => u.socketId !== socketId))
    })

    socket.on('stroke:added', (stroke) => {
      dispatch({ type: ACTIONS.ADD_STROKE, payload: stroke })
    })

    socket.on('canvas:cleared', () => {
      dispatch({ type: ACTIONS.CLEAR_CANVAS })
    })

    socket.on('cursor:updated', ({ socketId, cursor }) => {
      setOnlineUsersInRoom(prev => prev.map(u => 
        u.socketId === socketId ? { ...u, cursor } : u
      ))
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
  }, [user, setOnlineUsers])

  // Update state with online users
  useEffect(() => {
    if (onlineUsersInRoom.length > 0) {
      dispatch({ type: ACTIONS.SET_USERS, payload: onlineUsersInRoom })
    }
  }, [onlineUsersInRoom])

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
        
        // Load strokes
        if (Array.isArray(data.strokes)) {
          dispatch({ type: ACTIONS.CLEAR_CANVAS })
          data.strokes.forEach(stroke => {
            dispatch({ type: ACTIONS.ADD_STROKE, payload: stroke })
          })
        }
        
        // Load settings
        if (typeof data.isLayerLocked === 'boolean' && data.isLayerLocked !== state.isLayerLocked) {
          dispatch({ type: ACTIONS.TOGGLE_LAYER_LOCK })
        }
        if (data.collaborationMode) {
          dispatch({ type: ACTIONS.SET_COLLABORATION_MODE, payload: data.collaborationMode })
        }
      } catch (e) {
        console.error('Failed to load board', e)
      }
    }
    load()
  }, [])

  // Add current user to board collaborators
  useEffect(() => {
    const add = async () => {
      if (!user) return
      try {
        await fetch(`${API_BASE}/api/users/boards/${boardSlugRef.current}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
      } catch (e) {
        console.error('Failed to add user to board', e)
      }
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
    updateCursor: (cursor) => {
      socketRef.current?.emit('cursor:update', { room: boardSlugRef.current, cursor })
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
    <CollaborationContext.Provider value={{ state, dispatch, api, onlineUsers: onlineUsersInRoom }}>
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

export { ACTIONS, COLLABORATION_MODES }