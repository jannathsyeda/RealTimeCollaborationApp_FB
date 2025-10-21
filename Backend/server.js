const express=require('express')
const http=require('http')
const cors=require('cors')
const { Server }=require('socket.io')
require('dotenv').config()

const { connectDB }=require('./Config/db')
const boardsRouter=require('./routes/boards')
const usersRouter=require('./routes/users')

const app= express()
const server=http.createServer(app)

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Database
connectDB()

// Routes
app.use('/api/boards', boardsRouter)
app.use('/api/users', usersRouter)

// Socket.IO - Store active connections per room
const rooms = new Map() // roomId -> Map of socketId -> userInfo

const io=new Server(server,{
  cors:{
    origin:'http://localhost:5173',
    methods:['GET','POST'],
    credentials: true
  }
})

io.on('connection',(socket)=>{
  console.log('User connected:', socket.id)

  // Join room with user info
  socket.on('join', ({ room, userId, userName, userColor }) => {
    socket.join(room)
    
    // Initialize room if doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, new Map())
    }
    
    const roomUsers = rooms.get(room)
    roomUsers.set(socket.id, {
      socketId: socket.id,
      userId: userId,
      name: userName,
      color: userColor,
      cursor: { x: 0, y: 0 }
    })
    
    // Send current users to the new joiner
    const usersList = Array.from(roomUsers.values())
    socket.emit('users:list', usersList)
    
    // Notify others that user joined
    socket.to(room).emit('user:joined', {
      socketId: socket.id,
      userId: userId,
      name: userName,
      color: userColor,
      cursor: { x: 0, y: 0 }
    })
    
    console.log(`${userName} (${userId}) joined room: ${room}`)
  })

  socket.on('stroke:add',({ room, stroke })=>{
    socket.to(room).emit('stroke:added', stroke)
  })

  socket.on('canvas:clear',(room)=>{
    socket.to(room).emit('canvas:cleared')
  })

  socket.on('cursor:update',({ room, cursor })=>{
    const roomUsers = rooms.get(room)
    if (roomUsers && roomUsers.has(socket.id)) {
      const user = roomUsers.get(socket.id)
      user.cursor = cursor
      socket.to(room).emit('cursor:updated', {
        socketId: socket.id,
        cursor: cursor
      })
    }
  })

  socket.on('layer:lock',({ room, locked })=>{
    socket.to(room).emit('layer:locked', locked)
  })

  socket.on('mode:set',({ room, mode })=>{
    socket.to(room).emit('mode:updated', mode)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Remove user from all rooms
    rooms.forEach((roomUsers, room) => {
      if (roomUsers.has(socket.id)) {
        const user = roomUsers.get(socket.id)
        roomUsers.delete(socket.id)
        
        // Notify others
        io.to(room).emit('user:left', socket.id)
        
        console.log(`${user.name} left room: ${room}`)
        
        // Clean up empty rooms
        if (roomUsers.size === 0) {
          rooms.delete(room)
        }
      }
    })
  })
})

const PORT=process.env.PORT||5000
server.listen(PORT,()=>console.log('server running on port '+PORT))