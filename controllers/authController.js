const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =========================================================
   1. Helper functions
   Shared helpers for JWT creation and common auth responses
   ========================================================= */

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};

const sendUserNotFound = (res) => {
    return res.status(404).json({
        message: "User not found",
    });
};

const sendDuplicateEmail = (res) => {
    return res.status(400).json({
        message: "A user with this email already exists",
    });
};

/* =========================================================
   2. Register controller
   Creates a new user, hashes the password, and returns a JWT
   ========================================================= */

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return sendDuplicateEmail(res);
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            [name, email, passwordHash]
        );

        const user = {
            id: result.insertId,
            name,
            email,
        };

        const token = generateToken(user);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   3. Login controller
   Verifies credentials and returns a JWT for the user
   ========================================================= */

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const user = rows[0];

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const token = generateToken(user);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   4. Current user controller
   Returns the authenticated user's profile
   ========================================================= */

const getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.query(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return sendUserNotFound(res);
        }

        const user = rows[0];

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   5. Profile update controller
   Updates the authenticated user's name and/or email
   Returns a fresh JWT so the frontend stays in sync
   ========================================================= */

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;

        const [existingRows] = await pool.query(
            "SELECT id, name, email FROM users WHERE id = ?",
            [userId]
        );

        if (existingRows.length === 0) {
            return sendUserNotFound(res);
        }

        const existingUser = existingRows[0];

        const updatedName = name !== undefined ? name : existingUser.name;
        const updatedEmail = email !== undefined ? email : existingUser.email;

        if (email !== undefined && email !== existingUser.email) {
            const [duplicateEmailRows] = await pool.query(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [updatedEmail, userId]
            );

            if (duplicateEmailRows.length > 0) {
                return sendDuplicateEmail(res);
            }
        }

        await pool.query(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            [updatedName, updatedEmail, userId]
        );

        const updatedUser = {
            id: userId,
            name: updatedName,
            email: updatedEmail,
        };

        const token = generateToken(updatedUser);

        res.json({
            message: "Profile updated successfully",
            token,
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   6. Password change controller
   Verifies the current password and saves a new hashed password
   ========================================================= */

const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const [rows] = await pool.query(
            "SELECT id, password_hash FROM users WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return sendUserNotFound(res);
        }

        const user = rows[0];

        const isCurrentPasswordMatch = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );

        // Wrong current password is a form error, not a session failure
        if (!isCurrentPasswordMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [newPasswordHash, userId]
        );

        res.json({
            message: "Password updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   7. Account deletion controller
   Confirms the password, then deletes the authenticated user
   ========================================================= */

const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        const [rows] = await pool.query(
            "SELECT id, password_hash FROM users WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return sendUserNotFound(res);
        }

        const user = rows[0];

        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        // Wrong password here should not log the user out
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Password is incorrect",
            });
        }

        await pool.query(
            "DELETE FROM users WHERE id = ?",
            [userId]
        );

        res.json({
            message: "Account deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   8. Exports
   ========================================================= */

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    updateProfile,
    changePassword,
    deleteAccount,
};