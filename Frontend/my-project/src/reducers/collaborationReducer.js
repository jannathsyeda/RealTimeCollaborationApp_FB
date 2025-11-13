export const ACTIONS = {
  SET_TOOL: 'SET_TOOL',
  SET_COLOR: 'SET_COLOR',
  SET_SIZE: 'SET_SIZE',
  ADD_STROKE: 'ADD_STROKE',
  CLEAR_CANVAS: 'CLEAR_CANVAS',
  UPDATE_USER_CURSOR: 'UPDATE_USER_CURSOR',
  TOGGLE_COLLABORATION: 'TOGGLE_COLLABORATION',
  SET_COLLABORATION_MODE: 'SET_COLLABORATION_MODE',
  ADD_COLLABORATOR: 'ADD_COLLABORATOR',
  REMOVE_COLLABORATOR: 'REMOVE_COLLABORATOR',
  TOGGLE_LAYER_LOCK: 'TOGGLE_LAYER_LOCK',
  SET_IS_DRAWING: 'SET_IS_DRAWING',
  SET_USERS: 'SET_USERS'
}

export const initialState = {
  currentTool: 'draw',
  currentColor: '#3b82f6',
  currentSize: 3,
  strokes: [],
  collaborationEnabled: false,
  collaborationMode: 'invite-only',
  isLayerLocked: false,
  collaborators: [],
  users: [],
  pendingInvites: [],
  isDrawing: false
}

export const COLLABORATION_MODES = {
  'invite-only': { label: 'Invite Only', description: 'Only invited users can edit' },
  'open': { label: 'Open Access', description: 'Anyone with link can edit' },
  'view-only': { label: 'View Only', description: 'Others can only view, not edit' }
}

export function collaborationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_TOOL:
      return { ...state, currentTool: action.payload }
    case ACTIONS.SET_COLOR:
      return { ...state, currentColor: action.payload }
    case ACTIONS.SET_SIZE:
      return { ...state, currentSize: action.payload }
    case ACTIONS.ADD_STROKE:
      return { ...state, strokes: [...state.strokes, action.payload] }
    case ACTIONS.CLEAR_CANVAS:
      return { ...state, strokes: [] }
    case ACTIONS.UPDATE_USER_CURSOR:
      return {
        ...state,
        users: state.users.map(user =>
          user.socketId === action.payload.socketId
            ? { ...user, cursor: action.payload.position }
            : user
        )
      }
    case ACTIONS.TOGGLE_COLLABORATION:
      return { ...state, collaborationEnabled: !state.collaborationEnabled }
    case ACTIONS.SET_COLLABORATION_MODE:
      return { ...state, collaborationMode: action.payload }
    case ACTIONS.ADD_COLLABORATOR:
      return { 
        ...state, 
        collaborators: [...state.collaborators, action.payload],
        pendingInvites: state.pendingInvites.filter(invite => invite.id !== action.payload.id)
      }
    case ACTIONS.REMOVE_COLLABORATOR:
      return { 
        ...state, 
        collaborators: state.collaborators.filter(collab => collab.id !== action.payload)
      }
    case ACTIONS.TOGGLE_LAYER_LOCK:
      return { ...state, isLayerLocked: !state.isLayerLocked }
    case ACTIONS.SET_IS_DRAWING:
      return { ...state, isDrawing: action.payload }
    case ACTIONS.SET_USERS:
      // ✅ FIX: Deduplicate users by userId before setting state
      const userMap = new Map()
      action.payload.forEach(user => {
        const id = user.userId || user.id
        if (!userMap.has(id)) {
          userMap.set(id, { ...user, userId: id, id: id })
        } else {
          // Keep most recent data (merge)
          const existing = userMap.get(id)
          userMap.set(id, { ...existing, ...user, userId: id, id: id })
        }
      })
      return { ...state, users: Array.from(userMap.values()) }
    default:
      return state
  }
}