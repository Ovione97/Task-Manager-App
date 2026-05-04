/* =========================================================
   1. Shared validation rules and helper functions
   These helpers keep the middleware shorter and easier to read
   ========================================================= */

const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Check whether a title is a non-empty string
const isValidTitle = (value) => {
    return typeof value === "string" && value.trim() !== "";
};

// Check whether completed is a boolean
const isValidCompleted = (value) => {
    return typeof value === "boolean";
};

// Check whether priority is one of the allowed values
const isValidPriority = (value) => {
    return ALLOWED_PRIORITIES.includes(value);
};

// Check whether a value matches YYYY-MM-DD and is a real calendar date
const isValidDateString = (value) => {
    if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
        return false;
    }

    const [yearString, monthString, dayString] = value.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
};

// Validate dueDate only when it is provided and not null
const validateDueDate = (dueDate, res) => {
    if (dueDate !== undefined && dueDate !== null && !isValidDateString(dueDate)) {
        res.status(400).json({
            message: "dueDate must be a valid date in YYYY-MM-DD format",
        });
        return false;
    }

    return true;
};

/* =========================================================
   2. Create task validation
   Ensures the request body is valid before creating a task
   ========================================================= */

const validateCreateTask = (req, res, next) => {
    const { title, completed, priority, dueDate } = req.body;

    if (!isValidTitle(title)) {
        return res.status(400).json({
            message: "Title is required and must be a non-empty string",
        });
    }

    if (completed !== undefined && !isValidCompleted(completed)) {
        return res.status(400).json({
            message: "Completed must be a boolean",
        });
    }

    if (priority !== undefined && !isValidPriority(priority)) {
        return res.status(400).json({
            message: "Priority must be low, medium, or high",
        });
    }

    if (!validateDueDate(dueDate, res)) {
        return;
    }

    req.body.title = title.trim();

    next();
};

/* =========================================================
   3. Update task validation
   Ensures at least one valid field is being updated
   ========================================================= */

const validateUpdateTask = (req, res, next) => {
    const { title, completed, priority, dueDate } = req.body;

    // Reject empty update requests
    if (
        title === undefined &&
        completed === undefined &&
        priority === undefined &&
        dueDate === undefined
    ) {
        return res.status(400).json({
            message: "At least one field is required to update",
        });
    }

    if (title !== undefined) {
        if (!isValidTitle(title)) {
            return res.status(400).json({
                message: "Title must be a non-empty string",
            });
        }

        req.body.title = title.trim();
    }

    if (completed !== undefined && !isValidCompleted(completed)) {
        return res.status(400).json({
            message: "Completed must be a boolean",
        });
    }

    if (priority !== undefined && !isValidPriority(priority)) {
        return res.status(400).json({
            message: "Priority must be low, medium, or high",
        });
    }

    if (!validateDueDate(dueDate, res)) {
        return;
    }

    next();
};

/* =========================================================
   4. Exports
   ========================================================= */

module.exports = {
    validateCreateTask,
    validateUpdateTask,
};