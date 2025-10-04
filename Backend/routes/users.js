const express=require('express')
const User=require('../models/User')
const Board=require('../models/Board')

const router=express.Router()

// Upsert user by email
router.post('/upsert', async (req,res)=>{
  try{
    const { name, email, color }=req.body
    if(!email) return res.status(400).json({ message:'email is required' })
    const update={}
    if(name) update.name=name
    if(color) update.color=color
    const user=await User.findOneAndUpdate(
      { email },
      { $set: update, $setOnInsert: { name: name||email.split('@')[0], email, color: color||'#3b82f6' } },
      { upsert:true, new:true }
    )
    res.json(user)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
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


