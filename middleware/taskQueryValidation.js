/* =========================================================
   1. Shared query validation rules
   Constants and helper functions for validating task queries
   ========================================================= */

const ALLOWED_PRIORITIES = ["low", "medium", "high"];

const ALLOWED_SORT_FIELDS = {
    id: "id",
    title: "title",
    priority: "priority",
    completed: "completed",
    dueDate: "due_date",
};

// Check whether completed is one of the accepted query string values
const isValidCompletedQuery = (value) => {
    return value === "true" || value === "false";
};

// Check whether priority is one of the allowed values
const isValidPriority = (value) => {
    return ALLOWED_PRIORITIES.includes(value);
};

// Check whether sortBy matches one of the allowed frontend options
const isValidSortField = (value) => {
    return Boolean(ALLOWED_SORT_FIELDS[value]);
};

// Check whether order is either ascending or descending
const isValidSortOrder = (value) => {
    return value === "asc" || value === "desc";
};

// Convert a string query value into a positive integer
const toPositiveInteger = (value) => {
    const parsedValue = parseInt(value, 10);

    if (Number.isNaN(parsedValue) || parsedValue < 1) {
        return null;
    }

    return parsedValue;
};

/* =========================================================
   2. Task query validation middleware
   Validates filtering, sorting, and pagination query params
   ========================================================= */

const validateTaskQuery = (req, res, next) => {
    const {
        completed,
        priority,
        sortBy = "id",
        order = "asc",
        page = "1",
        limit = "10",
    } = req.query;

    if (completed !== undefined && !isValidCompletedQuery(completed)) {
        return res.status(400).json({
            message: "completed must be true or false",
        });
    }

    if (priority !== undefined && !isValidPriority(priority)) {
        return res.status(400).json({
            message: "priority must be low, medium, or high",
        });
    }

    if (sortBy !== undefined && !isValidSortField(sortBy)) {
        return res.status(400).json({
            message: "sortBy must be id, title, priority, completed, or dueDate",
        });
    }

    if (order !== undefined && !isValidSortOrder(order)) {
        return res.status(400).json({
            message: "order must be asc or desc",
        });
    }

    const pageNumber = toPositiveInteger(page);
    const limitNumber = toPositiveInteger(limit);

    if (pageNumber === null) {
        return res.status(400).json({
            message: "page must be a number greater than 0",
        });
    }

    if (limitNumber === null) {
        return res.status(400).json({
            message: "limit must be a number greater than 0",
        });
    }

    // Save the cleaned query values so the controller can use them directly
    req.taskQuery = {
        completed: completed !== undefined ? completed === "true" : undefined,
        priority,
        sortColumn: ALLOWED_SORT_FIELDS[sortBy] || "id",
        sortOrder: order === "desc" ? "DESC" : "ASC",
        pageNumber,
        limitNumber,
    };

    next();
};

/* =========================================================
   3. Exports
   ========================================================= */

module.exports = validateTaskQuery;