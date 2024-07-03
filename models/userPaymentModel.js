const mongoose = require("mongoose");

const userPaymentSchema = new mongoose.Schema(
  {
    userId: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'users', 
        required: true 
    },
    method:{
        type:String,
        required:true,
    },
    accountNo:{
        type:String,
        required:true,
    },
    accountName: { 
        type: String,  
        required: true,
    },
    
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("UserPayment", userPaymentSchema);