import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
  },
  gender: {
    type: String,
  },
  aboutMe: {
    type: String,
  },
  location: {
    type: String,
  },
  topicList: [
    {
      type: String,
    },
  ],
  communities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'community',
    },
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'message',
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('user', UserSchema);
