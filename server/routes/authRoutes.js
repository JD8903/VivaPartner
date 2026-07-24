const express = require("express");

const { loginUser, forgotPassword,verifyOTP, resetPassword,} = require("../controllers/authController");
const { createTestUser } = require("../controllers/userController"); 

const router = express.Router();

router.post("/login", loginUser);

// Temporary route for testing
router.post("/register", createTestUser);

router.post(
  "/forgot-password",
  forgotPassword
);
router.post("/verify-otp", verifyOTP);

router.post("/reset-password", resetPassword);

module.exports = router;