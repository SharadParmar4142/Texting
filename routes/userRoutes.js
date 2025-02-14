const express = require("express");
const { registerUser, loginUser, searchUser } = require("../controller/usercontroller");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/search", authenticateToken, searchUser);

module.exports = router;