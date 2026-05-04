require("dotenv").config();

/* =========================================================
   1. External modules
   ========================================================= */

const express = require("express");
const path = require("path");

/* =========================================================
   2. Local modules
   ========================================================= */

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorHandler = require("./middleware/errorHandler");

/* =========================================================
   3. App setup
   ========================================================= */

const app = express();
const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "public");

/* =========================================================
   4. Global middleware
   ========================================================= */

// Parse incoming JSON request bodies
app.use(express.json());

// Serve static frontend files from the public folder
app.use(express.static(publicPath));

/* =========================================================
   5. API routes
   ========================================================= */

// Authentication routes
app.use("/api/auth", authRoutes);

// Task routes
app.use("/api/tasks", taskRoutes);

/* =========================================================
   6. Error handling
   Must come after routes so route errors can reach it
   ========================================================= */

app.use(errorHandler);

/* =========================================================
   7. Start server
   ========================================================= */

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});