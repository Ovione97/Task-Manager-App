const jwt = require("jsonwebtoken");

/* =========================================================
   1. Authentication middleware
   Verifies a JWT from the Authorization header
   ========================================================= */

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Reject requests with no Authorization header
        if (!authHeader) {
            return res.status(401).json({
                message: "Not authorized, no token provided",
            });
        }

        // Expect the header format: Bearer <token>
        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Not authorized, token format is invalid",
            });
        }

        // JWT verification requires the secret to exist
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Verify the token and extract the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Save authenticated user info for later middleware/controllers
        req.user = {
            id: decoded.id,
            email: decoded.email,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Not authorized, token is invalid or expired",
        });
    }
};

/* =========================================================
   2. Exports
   ========================================================= */

module.exports = protect;