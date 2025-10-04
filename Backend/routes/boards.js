const express=require('express')
const Board=require('../models/Board')

const router=express.Router()

// Create or get board by slug
router.post('/', async (req,res)=>{
  try{
    const { slug, title }=req.body
    if(!slug) return res.status(400).json({ message:'slug is required' })

    let board=await Board.findOne({ slug })
    if(!board){
      board=await Board.create({ slug, title:title||'Untitled Board' })
    }
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

// Get board by slug
router.get('/:slug', async (req,res)=>{
  try{
    const { slug }=req.params
    const board=await Board.findOne({ slug })
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

// Add stroke to board
router.post('/:slug/strokes', async (req,res)=>{
  try{
    const { slug }=req.params
    const { stroke }=req.body
    const board=await Board.findOneAndUpdate(
      { slug },
      { $push:{ strokes: stroke } },
      { new:true }
    )
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

// Clear canvas
router.post('/:slug/clear', async (req,res)=>{
  try{
    const { slug }=req.params
    const board=await Board.findOneAndUpdate(
      { slug },
      { $set:{ strokes:[] } },
      { new:true }
    )
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

// Update lock or mode
router.post('/:slug/settings', async (req,res)=>{
  try{
    const { slug }=req.params
    const { isLayerLocked, collaborationMode }=req.body
    const update={}
    if(typeof isLayerLocked==='boolean') update.isLayerLocked=isLayerLocked
    if(collaborationMode) update.collaborationMode=collaborationMode
    const board=await Board.findOneAndUpdate(
      { slug },
      { $set:update },
      { new:true }
    )
    if(!board) return res.status(404).json({ message:'Board not found' })
    res.json(board)
  }catch(err){
    console.error(err)
    res.status(500).json({ message:'server error' })
  }
})

module.exports=router


