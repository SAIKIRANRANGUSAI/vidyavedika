const path = require("path");
const db = require("../../config/db");

const bcrypt = require("bcryptjs");
//const db = require("../config/db");

// Middleware to get logo for all admin pages
// exports.getAdminLogo = async (req, res, next) => {
//     try {
//         const [rows] = await db.query("SELECT logo FROM settings LIMIT 1");
//         res.locals.logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
//     } catch (err) {
//         console.error(err);
//         res.locals.logo = "/admin/static/images/logo.png";
//     }
//     next();
// };

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
// function isAuthenticated(req, res, next) {
//   if (req.session && req.session.admin) {
//     return next(); // ✅ logged in
//   }
//   return res.redirect("/admin/login"); // ❌ not logged in
// }

// module.exports = isAuthenticated;


// GET dashboard page
// GET dashboard page
//const db = require("../../config/db");  // ✅ only once

exports.getDashboard = async (req, res) => {
  try {
    const [contactRows] = await db.query("SELECT * FROM get_in_touch LIMIT 1");
    const contactUs = contactRows[0] || {};

    const [detailsRows] = await db.query("SELECT * FROM contact_details LIMIT 1");
    const contactDetails = detailsRows[0] || {};

    const [messages] = await db.query("SELECT * FROM contact_messages ORDER BY created_at DESC");

    res.render("dashboard", {
      username: req.session.admin?.username || "Admin User",
      contactUs,
      contactDetails,
      messages
    });

  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Server error");
  }
};

// Middleware to check authentication
// adminController.js
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }

  // ⚡ Only redirect if you are NOT already on /admin/login
  if (req.path !== "/login") {
    return res.redirect("/admin/login");
  }

  next();
};

// GET change credentials page (optional if you render separately)
exports.getChangeCredentials = async (req, res) => {
  try {
    const adminId = req.session.admin.id;
    const [rows] = await db.query("SELECT username FROM admins WHERE id = ?", [adminId]);
    const currentUsername = rows[0]?.username || "";
    res.render("admin/dashboard", { username: currentUsername, error: null, success: null });
  } catch (err) {
    console.error(err);
    res.render("admin/dashboard", { username: req.session.admin.username, error: "Failed to load admin details", success: null });
  }
};

exports.postChangeCredentials = async (req, res) => {
  const { newUsername, currentPassword, newPassword, confirmNewPassword } = req.body;
  const adminId = req.session.admin.id;

  try {
    const [rows] = await db.query("SELECT password FROM admins WHERE id = ?", [adminId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect." });

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ error: "New passwords do not match." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE admins SET username = ?, password = ? WHERE id = ?", [newUsername, hashedPassword, adminId]);

    req.session.admin.username = newUsername;

    return res.json({ success: true, message: "Credentials updated successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};
// GET social links for dashboard
// adminController.js
// exports.getDashboardWithSocial = async (req, res) => {
//   try {
//     const [rows] = await db.query("SELECT * FROM admin_social WHERE id = 1");
//     const social = rows[0] || {};
//     res.render("admin/dashboard", {
//       admin: req.session.admin,
//       social,
//       socialError: null,
//       socialSuccess: null,
//       error: null,
//       success: null
//     });
//   } catch (err) {
//     console.error(err);
//     res.render("admin/dashboard", {
//       admin: req.session.admin,
//       social: {},
//       socialError: "Failed to load social links",
//       socialSuccess: null,
//       error: "Failed to load dashboard",
//       success: null
//     });
//   }
// };

// exports.postSocialSettings = async (req, res) => {
//   const { description, facebook, twitter, instagram, youtube, whatsapp } = req.body;

//   try {
//     const [rows] = await db.query("SELECT id FROM admin_social WHERE id = 1");

//     if (rows.length > 0) {
//       await db.query(
//         `UPDATE admin_social
//          SET description=?, facebook=?, twitter=?, instagram=?, youtube=?, whatsapp=?
//          WHERE id=1`,
//         [description, facebook, twitter, instagram, youtube, whatsapp]
//       );
//     } else {
//       await db.query(
//         `INSERT INTO admin_social (id, description, facebook, twitter, instagram, youtube, whatsapp)
//          VALUES (1, ?, ?, ?, ?, ?, ?)`,
//         [description, facebook, twitter, instagram, youtube, whatsapp]
//       );
//     }

//     res.json({ success: true, message: "Social links updated successfully!" });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error. Please try again." });
//   }
// };
