const mongoose = require("mongoose");

const userVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "please add name"],
    },
    uniqueString: {
      type: String,
      required: [true, "please add email"],
      unique: true,
    },
    createdAt: {
      type: Date,
      required: [true, "please add password"]
    },
    expiresAt: {
      type: Date,
      required: [true, "please add role"],
    },
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("userVerificationSchema", userVerificationSchema);