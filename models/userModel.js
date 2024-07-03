const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please add name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "please add email"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "please add password"],
      min: 6,
      max: 64,
    },
    role: {
      type: String,
      required: [true, "please add role"],
      default: "Buyer",
    },
    address: {
        type: String,
        required: [true, "please add address"],
        trim: true,
      },
    verified: {
        type: Boolean,
        required: [true, "please add verified"],
        default: false,
      },
    token: {
        type: String,
        required: [true, "please add token"],
      },
      lati:{
        type:String,

      },
      longi:{
        type:String,
      },
    resetPasswordToken:{
        type: String,
        default:undefined,
      },
    resetPasswordExpires :{
        type: Date,
        default:undefined,
      },
      pushToken :{
        type: String,
      },
      about:{
        type:String,
        default:"Click to add Bio"
      }
  },
  
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id, name: this.name },process.env.JWT_SECRET );
  return token;
};


module.exports = mongoose.model("User", userSchema);