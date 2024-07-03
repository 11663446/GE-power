const jwt = require('jsonwebtoken');
const User = require("../models/userModel");

function auth(req, res, next) {
  const token = req.header('authorization');
  console.log("rend",token);
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
}

module.exports = auth;
