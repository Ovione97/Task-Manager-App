/* =========================================================
   1. Shared validation helper functions
   ========================================================= */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 64;

const MAX_EMAIL_LENGTH = 255;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

// Check whether a value is a string with visible content
const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim() !== "";
};

// Normalize an email before validation/storage
const normalizeEmail = (value) => {
    return value.trim().toLowerCase();
};

// Check whether a value looks like a valid email address
const isValidEmail = (value) => {
    if (typeof value !== "string") {
        return false;
    }

    const normalizedEmail = normalizeEmail(value);

    return (
        normalizedEmail.length > 0 &&
        normalizedEmail.length <= MAX_EMAIL_LENGTH &&
        EMAIL_PATTERN.test(normalizedEmail)
    );
};

// Check whether a password is a string with an allowed length
const isValidPassword = (value) => {
    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        value.length >= MIN_PASSWORD_LENGTH &&
        value.length <= MAX_PASSWORD_LENGTH
    );
};

// Check whether a name is a trimmed string within allowed length limits
const isValidName = (value) => {
    if (typeof value !== "string") {
        return false;
    }

    const trimmedName = value.trim();

    return (
        trimmedName.length >= MIN_NAME_LENGTH &&
        trimmedName.length <= MAX_NAME_LENGTH
    );
};

// Build a consistent validation message for name length
const getNameLengthMessage = () => {
    return `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`;
};

// Build a consistent validation message for password length
const getPasswordLengthMessage = (label = "Password") => {
    return `${label} must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`;
};

/* =========================================================
   2. Register validation
   ========================================================= */

const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!isValidName(name)) {
        return res.status(400).json({
            message: getNameLengthMessage(),
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "A valid email is required",
        });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            message: getPasswordLengthMessage(),
        });
    }

    // Save cleaned values so the controller can use them directly
    req.body.name = name.trim();
    req.body.email = normalizeEmail(email);

    next();
};

/* =========================================================
   3. Login validation
   ========================================================= */

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "A valid email is required",
        });
    }

    if (!isNonEmptyString(password)) {
        return res.status(400).json({
            message: "Password is required",
        });
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({
            message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
        });
    }

    // Save cleaned email so the controller can use it directly
    req.body.email = normalizeEmail(email);

    next();
};

/* =========================================================
   4. Profile update validation
   ========================================================= */

const validateUpdateProfile = (req, res, next) => {
    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
        return res.status(400).json({
            message: "At least one field is required to update the profile",
        });
    }

    if (name !== undefined) {
        if (!isValidName(name)) {
            return res.status(400).json({
                message: getNameLengthMessage(),
            });
        }

        req.body.name = name.trim();
    }

    if (email !== undefined) {
        if (!isValidEmail(email)) {
            return res.status(400).json({
                message: "A valid email is required",
            });
        }

        req.body.email = normalizeEmail(email);
    }

    next();
};

/* =========================================================
   5. Password change validation
   ========================================================= */

const validateChangePassword = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!isNonEmptyString(currentPassword)) {
        return res.status(400).json({
            message: "Current password is required",
        });
    }

    if (!isValidPassword(newPassword)) {
        return res.status(400).json({
            message: getPasswordLengthMessage("New password"),
        });
    }

    next();
};

/* =========================================================
   6. Account deletion validation
   ========================================================= */

const validateDeleteAccount = (req, res, next) => {
    const { password } = req.body;

    if (!isNonEmptyString(password)) {
        return res.status(400).json({
            message: "Password is required to delete the account",
        });
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({
            message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
        });
    }

    next();
};

/* =========================================================
   7. Exports
   ========================================================= */

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    validateDeleteAccount,
};