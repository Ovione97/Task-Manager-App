const pool = require("../config/db");

/* =========================================================
   1. Shared constants
   Reuse the same SELECT fields across task queries
   ========================================================= */

const TASK_SELECT_FIELDS = "id, title, completed, priority, due_date";

/* =========================================================
   2. Helper functions
   ========================================================= */

// Convert a raw database row into the API shape used by the frontend
const formatTask = (task) => {
    const formattedTask = {
        id: task.id,
        title: task.title,
        completed: Boolean(task.completed),
        priority: task.priority,
    };

    // Only include dueDate when the task actually has one
    if (task.due_date) {
        formattedTask.dueDate = new Date(task.due_date).toISOString().split("T")[0];
    }

    return formattedTask;
};

// Build SQL filter conditions based on the authenticated user
// and validated query parameters
const buildTaskFilters = (userId, completed, priority) => {
    const conditions = ["user_id = ?"];
    const values = [userId];

    if (completed !== undefined) {
        conditions.push("completed = ?");
        values.push(completed);
    }

    if (priority !== undefined) {
        conditions.push("priority = ?");
        values.push(priority);
    }

    return { conditions, values };
};

// Return a consistent not-found response when a task does not belong
// to the authenticated user or does not exist
const sendTaskNotFound = (res) => {
    return res.status(404).json({ message: "Task not found" });
};

/* =========================================================
   3. Task controllers
   Each controller handles one task-related route
   ========================================================= */

// Get a paginated list of tasks for the authenticated user
const getAllTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const {
            completed,
            priority,
            sortColumn,
            sortOrder,
            pageNumber,
            limitNumber,
        } = req.taskQuery;

        let query = `SELECT ${TASK_SELECT_FIELDS} FROM tasks`;
        let countQuery = "SELECT COUNT(*) AS total FROM tasks";

        const { conditions, values } = buildTaskFilters(userId, completed, priority);
        const whereClause = ` WHERE ${conditions.join(" AND ")}`;

        query += whereClause;
        countQuery += whereClause;

        if (sortColumn === "priority") {
            query += `
                ORDER BY CASE
                    WHEN priority = 'low' THEN 1
                    WHEN priority = 'medium' THEN 2
                    WHEN priority = 'high' THEN 3
                END ${sortOrder}
            `;
        } else {
            query += ` ORDER BY ${sortColumn} ${sortOrder}`;
        }

        const offset = (pageNumber - 1) * limitNumber;
        query += " LIMIT ? OFFSET ?";

        const [countRows] = await pool.query(countQuery, values);
        const total = countRows[0].total;

        const [rows] = await pool.query(query, [...values, limitNumber, offset]);

        res.json({
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            tasks: rows.map(formatTask),
        });
    } catch (error) {
        next(error);
    }
};

// Get one task by its id for the authenticated user
const getTaskById = async (req, res, next) => {
    try {
        const taskId = req.taskId;
        const userId = req.user.id;

        const [rows] = await pool.query(
            `SELECT ${TASK_SELECT_FIELDS} FROM tasks WHERE id = ? AND user_id = ?`,
            [taskId, userId]
        );

        if (rows.length === 0) {
            return sendTaskNotFound(res);
        }

        res.json(formatTask(rows[0]));
    } catch (error) {
        next(error);
    }
};

// Create a new task for the authenticated user
const createTask = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, completed, priority, dueDate } = req.body;

        const [result] = await pool.query(
            "INSERT INTO tasks (title, completed, priority, due_date, user_id) VALUES (?, ?, ?, ?, ?)",
            [title, completed ?? false, priority ?? "medium", dueDate ?? null, userId]
        );

        const [rows] = await pool.query(
            `SELECT ${TASK_SELECT_FIELDS} FROM tasks WHERE id = ? AND user_id = ?`,
            [result.insertId, userId]
        );

        res.status(201).json(formatTask(rows[0]));
    } catch (error) {
        // Duplicate title is checked per user because of UNIQUE(user_id, title)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "You already have a task with this title",
            });
        }

        next(error);
    }
};

// Update only the fields sent by the client for the authenticated user
const updateTask = async (req, res, next) => {
    try {
        const taskId = req.taskId;
        const userId = req.user.id;
        const { title, completed, priority, dueDate } = req.body;

        const [existingRows] = await pool.query(
            `SELECT ${TASK_SELECT_FIELDS} FROM tasks WHERE id = ? AND user_id = ?`,
            [taskId, userId]
        );

        if (existingRows.length === 0) {
            return sendTaskNotFound(res);
        }

        const existingTask = existingRows[0];

        const updatedTitle = title !== undefined ? title : existingTask.title;
        const updatedCompleted =
            completed !== undefined ? completed : Boolean(existingTask.completed);
        const updatedPriority =
            priority !== undefined ? priority : existingTask.priority;
        const updatedDueDate =
            dueDate !== undefined ? dueDate : existingTask.due_date;

        await pool.query(
            "UPDATE tasks SET title = ?, completed = ?, priority = ?, due_date = ? WHERE id = ? AND user_id = ?",
            [updatedTitle, updatedCompleted, updatedPriority, updatedDueDate, taskId, userId]
        );

        const [updatedRows] = await pool.query(
            `SELECT ${TASK_SELECT_FIELDS} FROM tasks WHERE id = ? AND user_id = ?`,
            [taskId, userId]
        );

        res.json(formatTask(updatedRows[0]));
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "You already have a task with this title",
            });
        }

        next(error);
    }
};

// Delete a task for the authenticated user
const deleteTask = async (req, res, next) => {
    try {
        const taskId = req.taskId;
        const userId = req.user.id;

        const [rows] = await pool.query(
            `SELECT ${TASK_SELECT_FIELDS} FROM tasks WHERE id = ? AND user_id = ?`,
            [taskId, userId]
        );

        if (rows.length === 0) {
            return sendTaskNotFound(res);
        }

        const taskToDelete = formatTask(rows[0]);

        await pool.query(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [taskId, userId]
        );

        res.json({
            message: "Task deleted",
            deletedTask: taskToDelete,
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   4. Exports
   Make the controllers available to the routes file
   ========================================================= */

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
};