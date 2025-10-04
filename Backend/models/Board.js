const { mongoose }=require('../Config/db')

const StrokeSchema=new mongoose.Schema({
  id:{ type:String, required:true },
  tool:{ type:String, enum:['draw','erase'], required:true },
  color:{ type:String, required:true },
  size:{ type:Number, required:true },
  points:[{ x:Number, y:Number }],
  userId:{ type:String, required:true }
},{ _id:false })

const BoardSchema=new mongoose.Schema({
  slug:{ type:String, required:true, unique:true, index:true },
  title:{ type:String, default:'Untitled Board' },
  strokes:{ type:[StrokeSchema], default:[] },
  isLayerLocked:{ type:Boolean, default:false },
  collaborationMode:{ type:String, enum:['invite-only','open','view-only'], default:'invite-only' },
  collaborators:[{ type: mongoose.Schema.Types.ObjectId, ref:'User' }]
},{ timestamps:true })

module.exports=mongoose.model('Board', BoardSchema)


