import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  title: String,
  author: String,
  content: String,
  postedDate: {
    type: Date,
    default: () => new Date(),
  },
  updatedDate: {
    type: Date,
    default: () => new Date(),
  },
  tags: [String],
  likes: Number,
  comments: [String],
});

export const StoryModel = mongoose.model("Story", StorySchema);
