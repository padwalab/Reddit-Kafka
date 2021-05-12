import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema({
  communityName: {
    type: String,
    required: true,
    unique: true,
  },
  creatorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  joinRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  subscribers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  posts: [Number],
  rules: { type: Array, default: [] },
  images: [
    {
      type: String,
    },
  ],
  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  downvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
});

export default mongoose.model("community", CommunitySchema);
