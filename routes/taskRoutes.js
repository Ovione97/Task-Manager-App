const express = require("express");

/* =========================================================
   1. Router setup
   ========================================================= */

const router = express.Router();

/* =========================================================
   2. Controller imports
   ========================================================= */

const {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
} = require("../controllers/taskController");

/* =========================================================
   3. Middleware imports
   ========================================================= */

const {
    validateCreateTask,
    validateUpdateTask,
} = require("../middleware/taskValidation");

const validateTaskQuery = require("../middleware/taskQueryValidation");
const validateTaskIdParam = require("../middleware/taskParamValidation");
const protect = require("../middleware/authMiddleware");

/* =========================================================
   4. Route protection
   All task routes require a valid JWT
   ========================================================= */

router.use(protect);

/* =========================================================
   5. Task routes
   ========================================================= */

// Get all tasks with filtering, sorting, and pagination
router.get("/", validateTaskQuery, getAllTasks);

// Get a single task by id
router.get("/:id", validateTaskIdParam, getTaskById);

// Create a new task
router.post("/", validateCreateTask, createTask);

// Update an existing task
router.put("/:id", validateTaskIdParam, validateUpdateTask, updateTask);

// Delete a task
router.delete("/:id", validateTaskIdParam, deleteTask);

/* =========================================================
   6. Exports
   ========================================================= */

module.exports = router;