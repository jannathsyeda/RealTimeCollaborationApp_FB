const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
require('dotenv').config()

const { connectDB } = require('./Config/db')
const boardsRouter = require('./routes/boards')
const usersRouter = require('./routes/users')

const app = express()
const server = http.createServer(app)

// Updated CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL 
]

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false)
    }
    return callback(null, true)
  },
  credentials: true
}))

app.use(express.json())

// Database
connectDB()

// Routes
app.use('/api/boards', boardsRouter)
app.use('/api/users', usersRouter)

// Health check endpoint (important for Render)
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Socket.IO
const rooms = new Map() // room -> Map(userId -> {user data, sockets: Set})
const onlineUsers = new Set()
const socketToUser = new Map() // socketId -> {userId, room}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  onlineUsers.add(socket.id)
  io.emit('online:count', onlineUsers.size)

  socket.on('join', ({ room, userId, userName, userColor }) => {
    socket.join(room)
    
    // Initialize room if doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, new Map())
    }
    
    const roomUsers = rooms.get(room)
    
    // ✅ FIX: Check if user already exists in room (by userId, not socketId)
    if (roomUsers.has(userId)) {
      // User already in room (from another tab/device)
      const existingUser = roomUsers.get(userId)
      
      // Add this socket to the user's socket set
      existingUser.sockets.add(socket.id)
      
      // Update user info (in case name/color changed)
      existingUser.name = userName
      existingUser.color = userColor
      
      console.log(`${userName} (${userId}) rejoined room ${room} with new socket: ${socket.id}`)
    } else {
      // New user joining room
      roomUsers.set(userId, {
        userId: userId,
        name: userName,
        color: userColor,
        cursor: { x: 0, y: 0 },
        sockets: new Set([socket.id]) // Track all sockets for this user
      })
      
      console.log(`${userName} (${userId}) joined room: ${room}`)
    }
    
    // Track socket to user mapping for disconnect handling
    socketToUser.set(socket.id, { userId, room })
    
    // Send full users list to the joining socket
    const usersList = Array.from(roomUsers.values()).map(user => ({
      userId: user.userId,
      name: user.name,
      color: user.color,
      cursor: user.cursor,
      socketId: Array.from(user.sockets)[0], // Send first socket for compatibility
      isActive: true
    }))
    
    socket.emit('users:list', usersList)
    
    // Only notify others if this is a NEW user (not just a new tab)
    if (roomUsers.get(userId).sockets.size === 1) {
      socket.to(room).emit('user:joined', {
        userId: userId,
        name: userName,
        color: userColor,
        cursor: { x: 0, y: 0 },
        socketId: socket.id,
        isActive: true
      })
    }
  })

  socket.on('stroke:add', ({ room, stroke }) => {
    socket.to(room).emit('stroke:added', stroke)
  })

  socket.on('canvas:clear', (room) => {
    socket.to(room).emit('canvas:cleared')
  })

  socket.on('cursor:update', ({ room, cursor }) => {
    const mapping = socketToUser.get(socket.id)
    if (!mapping) return
    
    const roomUsers = rooms.get(room)
    if (roomUsers && roomUsers.has(mapping.userId)) {
      const user = roomUsers.get(mapping.userId)
      user.cursor = cursor
      
      // Broadcast cursor update with userId instead of socketId
      socket.to(room).emit('cursor:updated', {
        userId: mapping.userId,
        socketId: socket.id,
        cursor: cursor
      })
    }
  })

  socket.on('layer:lock', ({ room, locked }) => {
    socket.to(room).emit('layer:locked', locked)
  })

  socket.on('mode:set', ({ room, mode }) => {
    socket.to(room).emit('mode:updated', mode)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    onlineUsers.delete(socket.id)
    io.emit('online:count', onlineUsers.size)
    
    // Get user info from socket mapping
    const mapping = socketToUser.get(socket.id)
    if (!mapping) return
    
    const { userId, room } = mapping
    const roomUsers = rooms.get(room)
    
    if (roomUsers && roomUsers.has(userId)) {
      const user = roomUsers.get(userId)
      
      // Remove this socket from user's socket set
      user.sockets.delete(socket.id)
      
      // ✅ FIX: Only remove user and notify if they have NO more sockets
      if (user.sockets.size === 0) {
        roomUsers.delete(userId)
        
        // Notify others that user left
        io.to(room).emit('user:left', socket.id)
        
        console.log(`${user.name} (${userId}) left room: ${room} (all tabs closed)`)
        
        // Clean up empty room
        if (roomUsers.size === 0) {
          rooms.delete(room)
        }
      } else {
        console.log(`${user.name} (${userId}) closed one tab, still has ${user.sockets.size} active`)
      }
    }
    
    // Clean up socket mapping
    socketToUser.delete(socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log('Server running on port ' + PORT))