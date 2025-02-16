const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const secretKey = process.env.ACCESS_TOKEN_SECRET;

// @desc Register a User
// @route POST /user/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName, gender, dateOfBirth, country } = req.body;

    if (!username || !email || !password || !fullName || !gender || !dateOfBirth || !country) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({ username, email, password: hashedPassword, fullName, gender, dateOfBirth, country });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Login a User
// @route POST /user/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ id: user._id, role: 'user' }, secretKey, { expiresIn: '1h' });
            res.status(200).json({ message: "User logged in", token });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Search a User
// @route GET /user/search
// @access Public
const searchUser = asyncHandler(async (req, res) => {
    const { username, email } = req.query;

    if (!username && !email) {
        return res.status(400).json({ message: "Username or email is required" });
    }

    try {
        const user = await User.findOne(username ? { username } : { email });

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = {
    registerUser,
    loginUser,
    searchUser
};


