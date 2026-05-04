/* =========================================================
   1. Centralized error-handling middleware
   Catches unexpected errors passed with next(error)
   ========================================================= */

const errorHandler = (err, req, res, _next) => {
    console.error(err);

    res.status(500).json({
        message: "Server error",
    });
};

module.exports = errorHandler;