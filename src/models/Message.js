import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { versionKey: false, collection: "message" }
);

export default mongoose.model("message", MessageSchema);
