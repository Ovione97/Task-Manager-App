/* =========================================================
   1. Route param validation
   Validates numeric task ids before controllers run
   ========================================================= */

const validateTaskIdParam = (req, res, next) => {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
        return res.status(400).json({
            message: "Task id must be a positive integer",
        });
    }

    req.taskId = taskId;
    next();
};

module.exports = validateTaskIdParam;
