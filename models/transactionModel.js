const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
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
    transaction:{
        type:String,
        required:true,
    },
    orderID:{
        type:String,
        required:true,
    },
    amount:{
        type:String,
        required:true,
    }
    
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);