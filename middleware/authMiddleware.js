const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const secretKey = process.env.ACCESS_TOKEN_SECRET;

const authenticateToken = asyncHandler(async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
});

module.exports = { authenticateToken };
