const { mongoose } = require('../config/db')

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  color: { type: String, default: '#3b82f6' }
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)


