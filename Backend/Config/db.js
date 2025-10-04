const mongoose=require('mongoose')
require('dotenv').config()

async function connectDB(){
  // const uri=process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/realtime_collab'
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected')
  }catch(err){
    console.error('MongoDB connection error',err)
    process.exit(1)
  }
}

module.exports={ connectDB, mongoose }
