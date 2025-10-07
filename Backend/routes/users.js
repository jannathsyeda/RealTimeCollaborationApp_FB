const express=require('express')
const User=require('../models/User')
const Board=require('../models/Board')

const router=express.Router()

// Upsert user by email
router.post('/upsert', async (req, res) => {
  try {
    const { name, email, color, settings } = req.body
    
    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    
    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail })
    
    if (user) {
      // UPDATE existing user
      if (name) user.name = name.trim()
      if (color) user.color = color
      if (settings) user.settings = { ...user.settings, ...settings }
      user.lastActive = new Date()
      
      await user.save()
    } else {
      // CREATE new user
      user = new User({
        name: name?.trim() || email.split('@')[0],
        email: normalizedEmail,
        color: color || '#3b82f6',
        settings: settings || {}
      })
      
      await user.save()
    }

    res.json(user)
  } catch (err) {
    console.error('Upsert error:', err)
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      })
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(err.errors).map(e => e.message)
      })
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
})

// Add user to board collaborators
router.post('/boards/:slug/add', async (req,res)=>{
  try{
    const { slug }=req.params
    const { userId }=req.body
    const board=await Board.findOneAndUpdate(
      { slug },
      { $addToSet:{ collaborators: userId } },
      { new:true }
    ).populate('collaborators')
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

// Remove user from board
router.post('/boards/:slug/remove', async (req,res)=>{
  try{
    const { slug }=req.params
    const { userId }=req.body
    const board=await Board.findOneAndUpdate(
      { slug },
      { $pull:{ collaborators: userId } },
      { new:true }
    ).populate('collaborators')
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

// List users for a board
router.get('/boards/:slug', async (req,res)=>{
  try{
    const { slug }=req.params
    const board=await Board.findOne({ slug }).populate('collaborators')
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board.collaborators)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

module.exports=router


