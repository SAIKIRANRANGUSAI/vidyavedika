const path = require("path");

// GET login page
exports.getLogin = (req, res) => {
    // __dirname is admin/controllers
    const loginView = path.join(__dirname, "../views/login.ejs");
    res.render(loginView);
};

// POST login
exports.postLogin = (req, res) => {
    const { username, password } = req.body;

    if(username === "admin" && password === "123456") {
        req.session.admin = true;
        res.redirect("/admin/dashboard");
    } else {
        res.send("Invalid credentials");
    }
};

// Middleware to protect routes
exports.isAuthenticated = (req, res, next) => {
    if(req.session && req.session.admin) return next();
    res.redirect("/admin/login");
};

// GET dashboard page
exports.getDashboard = (req, res) => {
    const dashboardView = path.join(__dirname, "../views/dashboard.ejs");

    const contactData = [
        { name: "admin", email: "john@example.com", message: "Hello!" },
        { name: "Jane Smith", email: "jane@example.com", message: "Hi there!" }
    ];

    res.render(dashboardView, { contactData });
};
