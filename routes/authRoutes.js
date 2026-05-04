const express = require("express");

/* =========================================================
   1. Router setup
   ========================================================= */

const router = express.Router();

/* =========================================================
   2. Controller imports
   ========================================================= */

const {
    registerUser,
    loginUser,
    getCurrentUser,
    updateProfile,
    changePassword,
    deleteAccount,
} = require("../controllers/authController");

/* =========================================================
   3. Middleware imports
   ========================================================= */

const {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    validateDeleteAccount,
} = require("../middleware/authValidation");

const protect = require("../middleware/authMiddleware");

/* =========================================================
   4. Auth routes
   ========================================================= */

// Register a new user
router.post("/register", validateRegister, registerUser);

// Log in an existing user
router.post("/login", validateLogin, loginUser);

// Get the currently authenticated user
router.get("/me", protect, getCurrentUser);

// Update the authenticated user's profile
router.put("/profile", protect, validateUpdateProfile, updateProfile);

// Change the authenticated user's password
router.put("/password", protect, validateChangePassword, changePassword);

// Delete the authenticated user's account
router.delete("/account", protect, validateDeleteAccount, deleteAccount);

/* =========================================================
   5. Exports
   ========================================================= */

module.exports = router;