const express = require("express");
const bodyParser = require('body-parser');

const {
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
    updateExpo,
  } = require("../controllers/userController");
const auth = require("../auth/auth");

  
const router = express.Router();
router.use(bodyParser.json());

router.post("/register", registerController);


router.post("/login", loginController);
router.get('/verify',userVerification)
router.post('/forget-password',forgotPassword)
router.post('/update-password',updatePassword); 


router.post('/surplus',auth,SurplusOrder)
router.post('/showSurplus',auth,showSurplusOrder)
router.post('/detailSurplus',openSurplusOrder)


router.post('/ev',auth,evOrder)
router.post('/showEv',auth,showEvOrder)
router.post('/detailEv',openEvOrder)


router.post('/getUserData',auth,getUserData);
router.post('/getUser',auth,getUser);
router.post('/getUserOrders',auth,getUserOrders);
router.put('/about',auth,updateAbout);
router.post('/updateExpo',auth,updateExpo);



router.post('/addPaymentDetail',auth,addPaymentDetail);
router.post('/addTransaction',auth,addTransaction);



router.post('/adminLogin',adminLogin);
router.post('/adminByUserId',adminByUserId);





router.post('/surplusMatchOrders',auth,surplusMatchOrders)

router.post("/esp",(req, res) => {
  console.log(`Received data: ${JSON.stringify(req.body)}`);
  res.status(200).send('waqar');

  res.status(200).send({
    success:true,
  })
})




module.exports = router;