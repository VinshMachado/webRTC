import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },

  profile: {
    type: String,
    required: true,
    trim: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
