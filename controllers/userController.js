const userModel = require("../models/userModel");
// const surplusOrderModel = require("../models/surplusOrderModel");
const { hashPassword,comparePassword } = require("../helpers/authHelper");
const JWT = require("jsonwebtoken");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const {v4:uuidv4}=require('uuid');
const crypto = require('crypto');
const surplusOrderModel = require("../models/surplusOrderModel");
const evOrderModel = require("../models/evOrderModel");
const { Expo } = require('expo-server-sdk');
const userPaymentModel = require("../models/userPaymentModel");
const transactionModel = require("../models/transactionModel");

let expo = new Expo();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "muhwaqarr28@gmail.com",
    pass: "ckppqdlwkerwakqz",
  },
});

const registerController = async (req, res) => {
    try {
      const { name, email, password,address,role,lati,longi,pushToken } = req.body;
      //validation
      if (!name) {
        return res.status(400).send({
          success: false,
          message: "name is required",
        });
      }
      if (!email) {
        return res.status(400).send({
          success: false,
          message: "email is required",
        });
      }
      if (!password || password.length < 6) {
        return res.status(400).send({
          success: false,
          message: "password is required and 6 character long",
        });
      }
      if (!address) {
        return res.status(400).send({
          success: false,
          message: "address is required",
        });
      }
      if (!role) {
        return res.status(400).send({
          success: false,
          message: "role is required",
        });
      }
      if (!lati) {
        return res.status(400).send({
          success: false,
          message: "lati is required",
        });
      }
      if (!longi) {
        return res.status(400).send({
          success: false,
          message: "longi is required",
        });
      }
      // exisiting user
      const exisitingUser = await userModel.findOne({ email });
      if (exisitingUser) {
        return res.status(500).send({
          success: false,
          message: "User Already Register With This EMail",
        });
      }
      // hashed pasword
      const hashedPassword = await hashPassword(password);
      const token = crypto.randomBytes(32).toString('hex');
      //save user
      const user = await userModel({
        name,
        email,
        password: hashedPassword, 
        address,
        role,
        token,
        lati,
        longi,
        pushToken
      }).save();
  

      const url = `http://localhost:8080/api/v1/auth/verify?token=${token}&email=${email}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res.status(500).send('Error sending email');
        }
        res.status(200).send('Verification email sent');
      });

      return res.status(201).send({
        success: true,
        message: "Please verify the email and then login",
        user
      });


      
 }
  catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Error in Register API OR check you can verifty you Email",
        error,
      });
    }

  }

  const loginController = async (req, res) => {
    try {
      const { email, password } = req.body;
      //validation
      if (!email || !password) {
        return res.status(500).send({
          success: false,
          message: "Please Provide Email Or Password",
        });
      }
      // find user
      const user = await userModel.findOne({ email });
      if(!user.verified){
        return res.status(500).send({
          success: false,
          message: "Please first verify the email goto your MailBox",
        });
      }
      if (!user) {
        return res.status(500).send({
          success: false,
          message: "User Not Found",
        });
      }
      //match password
      const match = await comparePassword(password, user.password);
      if (!match) {
        return res.status(500).send({
          success: false,
          message: "Invalid usrname or password",
        });
      } 
      //TOKEN JWT
      const token = user.generateAuthToken();
      console.log(token)
  
      // undeinfed password
      user.password = undefined;
      res.setHeader('authorization',token).status(200).send({
        success: true,
        message: "login successfully",
        token,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "error in login api",
        error,
      });
    }
  };
  
  const userVerification = async (req, res) => {
    const { token, email } = req.query;
    try {
      const user= await userModel.findOne({email,token});
      console.log(user);
      if (!user) {
        return res.status(400).send('Invalid token or email');
      }
  
      user.verified = true;
      await user.save();
      res.status(200).send({ message: 'Email verified successfully' });

    } catch (error) {
      console.log(error);
      console.log("cannt Get");

    }
    
  }



  const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).send('User not found');
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send the reset password email
    const resetURL = `http://localhost:8080/reset-password/${token}`;
    const mailOptions = {
      to: user.email,
      from: 'muhwaqarr28@gmail.com',
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested to reset your account's password.\n\n
             Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n
             ${resetURL}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({Message:'Password reset email sent. Going to Gmail to verifty it'});
  }
  catch(error){
    console.log(error)
  }
}   


const updatePassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired.');
    }

    // Set the new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).send('Password has been reset.');
  } catch (error) {
    res.status(500).send('Error resetting password. Please try again later.');
  }
}



const SurplusOrder = async (req, res) => {
  const{lati,longi,kwPerPlate,plates,pricePerUnit,availabilityStart,availabilityEnd,location,unit}=req.body;
  try {
    const orderId =uuidv4();
    const userId =req.user._id;
    let userRole = await userModel.findOne({_id:userId});
    const userName=userRole.name;
    userRole=userRole.role;
    console.log(userRole);

    const newOrder = await surplusOrderModel({
      userId,
      orderId,
      userRole,
      plates,
      pricePerUnit,
      kwPerPlate,
      availabilityStart,
      availabilityEnd,
      location,
      lati,
      longi,
      unit,
      userName
    });
  
    await newOrder.save();
    console.log(newOrder);
    res.status(201).send(newOrder);
  } catch (error) {
    console.log('error in order')
    res.status(500).send('Error creating order. Please try again later.');
  }

}

const showSurplusOrder = async (req, res) => {
  const userId=req.user._id;
  console.log(userId)
  try {
    const user = await userModel.findOne({_id:userId});
    const Role=String(user.role);
    const orders=await surplusOrderModel.find({userRole:{ $ne: Role }}); 
    console.log(Role);
    const lati=user.lati;
    const longi= user.longi;
    const orderUser = await userModel.find({_id:orders.userId});
    const def =await surplusOrderModel.find({userId:userId});
    const expo =user.pushToken;
    
    console.log(orders);
    const nearOrders=await orders.filter(orders=>{
      const distance = haversine(
        parseFloat(lati),
        parseFloat(longi),
        parseFloat(orders.lati),
        parseFloat(orders.longi)
    );
    return distance <= 1000;
    });
    console.log(orders);
    console.log(userId);
    res.json({nearOrders,orderUser})
    if(Role==='Seller'){
      for(const userOrder of def){
        for(const nearOrder of nearOrders){
          if(matchCriteria(userOrder,nearOrder)){
            sendNotification(nearOrder,expo);
            console.log("matched orders")
          }
        }
      }
    }

    if(Role==='Buyer'){
      for(const userOrder of def){
        for(const nearOrder of nearOrders){
          if(matchCriteria(userOrder,nearOrder)){
            sendNotification(nearOrder,expo);
            console.log("matched orders")
          }
        }
      }
    }
    
    
  } catch (error) {
    console.log(error);
  }
}
const openSurplusOrder = async (req, res) => {
  let id = req.body.id;
  try {
    
    const orderDetail=await surplusOrderModel.findById({_id:id});
    const userDetail=await userModel.findById({_id:orderDetail.userId})
    console.log(orderDetail)
    console.log(userDetail);
  res.json({
    orderDetail,
    userDetail
  })
  } catch (error) {
    console.log(error)
  }

}



const evOrder = async (req, res) => {
  const{lati,longi,level,opCurrent,connectorType,pricePerUnit,availabilityStart,availabilityEnd,location}=req.body;
  try {
    const orderId =uuidv4();
    const userId =req.user._id;
    let userRole = await userModel.findOne({_id:userId});
    const userName=userRole.name;
    userRole=userRole.role;
    console.log(userRole);

    const newOrder = await evOrderModel({
      userId,
      orderId,
      userRole,
      level,
      pricePerUnit,
      opCurrent,
      connectorType,
      availabilityStart,
      availabilityEnd,
      location,
      lati,
      longi,
      userName
    });
  
    await newOrder.save();
    console.log(newOrder);
    res.status(201).send(newOrder);
  } catch (error) {
    console.log('error in order')
  }

}


const showEvOrder = async (req, res) => {
  const userId=req.user._id;
  try {
    const user = await userModel.findOne({_id:userId});
    const Role=user.role;
    console.log(Role)
    const orders=await evOrderModel.find({userRole:{ $ne: Role }});
    
    console.log(orders);
    // console.log(userId);
    res.json({
      // user,
      orders,
    })
    
  } catch (error) {
    console.log(error);
  }
}

const openEvOrder = async (req, res) => {
  let id = req.body.id;
  try {
    
    const orderDetail=await evOrderModel.findById({_id:id});
    const userDetail=await userModel.findById({_id:orderDetail.userId})
    console.log(orderDetail)
    console.log(userDetail);
  res.json({
    orderDetail,
    userDetail
  })

  } catch (error) {
    console.log(error)
  }

}



function haversine(lat1, lon1, lat2, lon2) {
  const toRad = angle => (Math.PI / 180) * angle;
  const R = 6371e3; // Earth's radius in meters

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}



function matchCriteria(userOrders, allOrders) {
  return (
    userOrders.plates>=allOrders.plates &&
    userOrders.kwPerPlate>=allOrders.kwPerPlate &&
    userOrders.pricePerUnit<=allOrders.pricePerUnit &&
    new Date(userOrders.availabilityStart) <= new Date(allOrders.availabilityEnd) &&
    new Date(userOrders.availabilityEnd) >= new Date(allOrders.availabilityStart) 
  );
}





const surplusMatchOrders = async (req, res) => {
  const userId=req.user._id;
  try {

    const user=await userModel.findOne({_id:userId});
    const lati=user.lati;
    const longi=user.longi;
    const userRole=user.role;
    const userOrders =await surplusOrderModel.find({userId:userId});
    const allOrders=await surplusOrderModel.find({role:!userRole});
    const nearOrders=allOrders.filter(orders=>{
      const distance = haversine(
        parseFloat(lati),
        parseFloat(longi),
        parseFloat(orders.lati),
        parseFloat(orders.longi)
    );
    return distance <= 1000;
    });
    if(userRole==='Seller'){
      for(const userOrder of userOrders){
        for(const nearOrder of nearOrders){
          if(matchCriteria(userOrder,nearOrder)){
            sendNotification(nearOrder,);
          }
        }
      }
    }

    if(userRole==='Buyer'){
      for(const userOrder of userOrders){
        for(const nearOrder of nearOrders){
          if(matchCriteria(userOrder,nearOrder)){
            console.log("matched orders")
          }
        }
      }
    }
    
  res.send({
    
  })
  } catch (error) {
    console.log(error)
  }

  // sendNotification("ExponentPushToken[EKbRP6PWWLBNaP1PvamlQQ]");
  // res.send({
  //   data:"hello world"
  // })
}


function evMatchCriteria(userOrders, allOrders) {
  return (
    userOrders.level===allOrders.level &&
    userOrders.opCurrent>=allOrders.opCurrent &&
    userOrders.connectorType>=allOrders.connectorType &&
    userOrders.pricePerUnit<=allOrders.pricePerUnit &&
    new Date(userOrders.availabilityStart) <= new Date(allOrders.availabilityEnd) &&
    new Date(userOrders.availabilityEnd) >= new Date(allOrders.availabilityStart) 
  );
}

const evMatchOrders = async (req, res) => {
const userId=req.user._id;
  try {

    const user=await userModel.findOne({_id:userId});
    const lati=user.lati;
    const longi=user.longi;
    const userRole=user.role;
    const userOrders =await evOrderModel.find({userId:userId});
    const allOrders=await evOrderModel.find({role:!userRole});
    const nearOrders=allOrders.filter(orders=>{
      const distance = haversine(
        parseFloat(lati),
        parseFloat(longi),
        parseFloat(orders.lati),
        parseFloat(orders.longi)
    );
    return distance <= 1000;
    });
    if(userRole==='Seller'){
      for(const userOrder of userOrders){
        for(const nearOrder of nearOrders){
          if(evMatchCriteria(userOrder,nearOrder)){
            console.log("matched orders")
          }
        }
      }
    }

    if(userRole==='Buyer'){
      for(const userOrder of userOrders){
        for(const nearOrder of nearOrders){
          if(evMatchCriteria(userOrder,nearOrder)){
            console.log("matched orders")
          }
        }
      }
    }
    
  res.send({
    
  })
  } catch (error) {
    console.log(error)
  }

}



const sendNotification = async (order,token) => {
  const messages = [];

  if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      return;
  }

  messages.push({
      to: token,
      sound: 'default',
      title: 'Match found',
      body: `A matching order has been found for `,
      data: { order },
  });

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  (async () => {
      for (const chunk of chunks) {
          try {
              const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
              console.log(ticketChunk);
              tickets.push(...ticketChunk);
          } catch (error) {
              console.error(error);
          }
      }
  })();
};

const getUserData = async (req, res) => {
  const userId=req.user._id;
    try {
      const user = await userModel.findById({_id:userId});
      res.json({
        user
      })
    
  } catch (error) {
    console.log(error);
  }
}

const updateAbout = async (req, res) => {
  const _id=req.user._id;
  console.log(_id)
  const {about}=req.body;
  console.log(about)
  try {
    const user = await userModel.findByIdAndUpdate(
      _id,
      { about },
      { new: true, runValidators: true }
    );
    res.send({
      success:true
    }
    )
  } catch (error) {
    
  }
}

const addPaymentDetail = async (req, res) => {
  const _id=req.user._id;
  console.log(_id)
  const {method,accountNo,accountName}=req.body
  try {
    const payDetail=await userPaymentModel({
      userId:_id,
      method,
      accountNo,
      accountName
      
    })
    await payDetail.save();
    console.log(payDetail)
    res.send({
      success:true
    })
  } catch (error) {
    console.log(error)
  }
}


const addTransaction = async (req, res) => {
  const _id=req.user._id;
  const {method,accountNo,accountName,orderID,transaction,amount}=req.body
  const trt=String(transaction);
  console.log(accountName)
  try {
    const payDetail=await transactionModel({
      userId:_id,
      method,
      accountNo,
      accountName,
      orderID,
      transaction:trt,
      amount
      
    })
    await payDetail.save();
    console.log(payDetail)
    res.send({
      success:true
    })
  } catch (error) {
    console.log(error)
  }
}
const adminLogin = async (req, res) => {
  const {userName, password} = req.body;
  try {
    if(userName==="admin"&&password=="admin"){
      res.status(200).send({
        success: true,
        message: "login successfully",
      });
    }else{
      return res.status(500).send({
        success: false,
        message: "Please Enter valid UserName and Password",
      });
    }
  } catch (error) {
    
  }
}

const adminByUserId = async (req, res) => {
  const {userId} = req.body;
  try {
    const userInfo=await userModel.findById({_id:userId});
    const userSurplus= await surplusOrderModel.find({userId:userId});
    const userEv= await evOrderModel.find({userId:userId});
    const userPayment=await userPaymentModel.find({userId:userId});
    const userTransaction=await transactionModel.find({userId:userId});
    res.status(200).send({
      success: true,
      message: "Get Data Successfully by ID",
      userInfo,
      userSurplus,
      userTransaction,
      userPayment,
      userEv
    });
  } catch (error) {
    console.log(error)
  }
}

const getUserOrders=async(req,res)=>{
  const _id=req.user._id;
  try {
    const userOrder=await surplusOrderModel.find({userId:_id})
    res.json({userOrder})
  } catch (error) {
    console.log(error)
  }
}
const getUser=async(req,res)=>{
  const _id=req.user._id;
  try {
    const user=await userModel.findById({_id:_id})
    res.json({user})
  } catch (error) {
    console.log(error)
  }
}

const updateExpo = async (req, res) => {
  const _id=req.user._id;
  console.log(_id)
  const {pushToken}=req.body;
  try {
    const user = await userModel.findByIdAndUpdate(
      _id,
      { pushToken },
      { new: true, runValidators: true }
    );
    res.send({
      success:true
    }
    )
  } catch (error) {
    
  }
}

  module.exports = {
    registerController,
    loginController,
    userVerification,
    forgotPassword,
    updatePassword,
    SurplusOrder,
    showSurplusOrder,
    openSurplusOrder,
    evOrder,
    showEvOrder,
    openEvOrder,
    surplusMatchOrders,
    getUserData,
    updateAbout,
    addPaymentDetail,
    addTransaction,
    adminLogin,
    adminByUserId,
    getUserOrders,
    getUser,
    updateExpo
  };