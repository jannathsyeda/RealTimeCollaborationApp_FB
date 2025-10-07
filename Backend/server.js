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

// app.use(cors())
// const cors = require('cors')

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

// Socket.IO
const io=new Server(server,{
  cors:{
    origin:'*',
    methods:['GET','POST']
  }
})

io.on('connection',(socket)=>{
  // Default room per board slug (client should send once connected)
  socket.on('join',(room)=>{
    socket.join(room)
  })

  socket.on('stroke:add',({ room, stroke })=>{
    socket.to(room).emit('stroke:added', stroke)
  })

  socket.on('canvas:clear',(room)=>{
    socket.to(room).emit('canvas:cleared')
  })

  socket.on('cursor:update',({ room, user })=>{
    socket.to(room).emit('cursor:updated', user)
  })

  socket.on('layer:lock',({ room, locked })=>{
    socket.to(room).emit('layer:locked', locked)
  })

  socket.on('mode:set',({ room, mode })=>{
    socket.to(room).emit('mode:updated', mode)
  })
})

const PORT=process.env.PORT||5000
server.listen(PORT,()=>console.log('server running on port '+PORT))