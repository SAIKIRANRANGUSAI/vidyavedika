const path = require("path");
const db = require("../../config/db");
const bcrypt = require("bcrypt");

// Middleware to get logo for all admin pages
exports.getAdminLogo = async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT logo FROM settings LIMIT 1");
        res.locals.logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
    } catch (err) {
        console.error(err);
        res.locals.logo = "/admin/static/images/logo.png";
    }
    next();
};

// GET login page
exports.getLogin = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT logo FROM settings LIMIT 1");
        const logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
        res.render("login", { logo });
    } catch (err) {
        console.error(err);
        res.render("login", { logo: "/admin/static/images/logo.png" });
    }
};

// POST login
exports.postLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);

        if (rows.length === 0) {
            return res.send("Invalid credentials");
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.send("Invalid credentials");
        }

        req.session.admin = true;
        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

// Middleware to protect routes
exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) return next();
    res.redirect("/admin/login");
};

// GET dashboard page
// GET dashboard page
exports.getDashboard = async (req, res) => {
    try {
        const [contactData] = await db.query("SELECT name, email, message FROM contacts");

        // Use the session data to get the username
        const username = req.session.admin?.username || "Admin User";

        res.render("dashboard", {
            contactData,
            username, // Pass the username variable to the view
            success: null,
            error: null
        });
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.render("dashboard", {
            contactData: [],
            username: "Admin User", // Also pass a default value in case of an error
            error: "Server error. Could not load dashboard.",
            success: null
        });
    }
};

// GET change credentials page
exports.getChangeCredentials = async (req, res) => {
    // Use the session ID to load the current username
    const adminId = req.session.admin.id;

    try {
        const [rows] = await db.query("SELECT username FROM admins WHERE id = ?", [adminId]);
        const currentUsername = rows[0]?.username || "";
        res.render("admin/change-credentials", {
            username: currentUsername,
            error: null,
            success: null
        });
    } catch (err) {
        console.error(err);
        res.render("admin/change-credentials", {
            username: req.session.admin.username,
            error: "Failed to load admin details",
            success: null
        });
    }
};

// POST change credentials
exports.postChangeCredentials = async (req, res) => {
    const { newUsername, currentPassword, newPassword, confirmNewPassword } = req.body;
    const adminId = req.session.admin.id;

    try {
        if (!req.session.admin || !adminId) {
            return res.status(401).render("admin/change-credentials", {
                username: null,
                error: "Unauthorized access. Please log in again.",
                success: null
            });
        }

        // 1. Verify the current password
        const [rows] = await db.query("SELECT password FROM admins WHERE id = ?", [adminId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).render("admin/change-credentials", {
                username: req.session.admin.username,
                error: "User not found.",
                success: null
            });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).render("admin/change-credentials", {
                username: req.session.admin.username,
                error: "Current password is incorrect.",
                success: null
            });
        }

        // 2. Check if new passwords match
        if (newPassword !== confirmNewPassword) {
            return res.status(400).render("admin/change-credentials", {
                username: req.session.admin.username,
                error: "New passwords do not match.",
                success: null
            });
        }

        // 3. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update the database
        await db.query(
            "UPDATE admins SET username = ?, password = ? WHERE id = ?",
            [newUsername, hashedPassword, adminId]
        );

        // 5. Update the session with the new username
        req.session.admin.username = newUsername;

        return res.status(200).render("admin/change-credentials", {
            username: newUsername,
            success: "Credentials updated successfully!",
            error: null
        });

    } catch (err) {
        console.error("Error updating credentials:", err);
        return res.status(500).render("admin/change-credentials", {
            username: req.session.admin ? req.session.admin.username : null,
            error: "Server error. Please try again.",
            success: null
        });
    }
};