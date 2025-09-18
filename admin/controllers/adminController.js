const path = require("path");
const db = require("../../config/db");
const jwt = require("jsonwebtoken");

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
// middlewares

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
  console.log("1");
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

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
     "12345678",
      { expiresIn: "1h" }
    );

    // Send JWT as cookie
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "strict" });

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Middleware to protect routes
// function isAuthenticated(req, res, next) {
//   if (res.cookie && res.cookie.admin) {
//     return next(); // ✅ logged in
//   }
//   return res.redirect("/admin/login"); // ❌ not logged in
// }

// module.exports = isAuthenticated;


// GET dashboard page
// GET dashboard page
//const db = require("../../config/db");  // ✅ only once

// exports.getDashboard = async (req, res) => {
//   try {
//     const [contactRows] = await db.query("SELECT * FROM get_in_touch LIMIT 1");
//     const contactUs = contactRows[0] || {};

//     const [detailsRows] = await db.query("SELECT * FROM contact_details LIMIT 1");
//     const contactDetails = detailsRows[0] || {};

//     const [messages] = await db.query("SELECT * FROM contact_messages ORDER BY created_at DESC");

//     res.render("dashboard", {
//       username: res.cookie.admin?.username || "Admin User",
//       contactUs,
//       contactDetails,
//       messages
//     });

//   } catch (err) {
//     console.error("Error loading dashboard:", err);
//     res.status(500).send("Server error");
//   }
// };

// Middleware to check authentication
// adminController.js
// exports.isAuthenticated = (req, res, next) => {
//   if (res.cookie && res.cookie.admin) {
//     return next();
//   }

//   // Allow login and static assets
//   if (req.path === "/login" || req.path.startsWith("/static")) {
//     return next();
//   }

//   return res.redirect("/admin/login");
// };

// exports.isAuthenticated = (req, res, next) => {
//   console.log("Checking authentication for:", req.path);
//   try {
//     const token = req.cookies?.token; // ✅ safer access

//     if (!token) {
//       return res.redirect("/admin/login");
//     }

//     // ✅ Verify with secret from .env
//     const decoded = jwt.verify(token, "12345678");

//     // Attach decoded user to request
//     req.user = decoded;

//     next();
//   } catch (err) {
//     console.error("Auth error:", err.message);
//     return res.redirect("/admin/login");
//   }
// };
// exports.isAuthenticated = (req, res, next) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.redirect("/admin/login");
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // attach user data to request
//     return next();
//   } catch (err) {
//     return res.redirect("/admin/login");
//   }
// };


// exports.isAuthenticated = (req, res, next) => {
  
//   const token = req.cookies.token;
//   console.log("2");
//   if (!token) {
//     return res.redirect("/admin/login");
//   }

//   try {
//     const decoded = jwt.verify(token, "12345678");
//     req.user = decoded; // attach user data to request
//     return next();
//   } catch (err) {
//     return res.redirect("/admin/login");
//   }
// };

exports.isAuthenticated = (req, res, next) => {
  // Public routes that should bypass auth
  if (
    req.path === "/login" ||
    req.path === "/logout" ||
    req.path.startsWith("/static")
  ) {
    return next();
  }

  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/admin/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "12345678");
    req.user = decoded;
    return next();
  } catch (err) {
    return res.redirect("/admin/login");
  }
};

// GET change credentials page (optional if you render separately)
// GET change credentials page (optional if you render separately)
exports.getChangeCredentials = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/admin/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "12345678");
    const adminId = decoded.id;

    const [rows] = await db.query("SELECT username FROM admins WHERE id = ?", [adminId]);
    const currentUsername = rows[0]?.username || "";

    res.render("admin/change-credentials", {
      username: currentUsername,
      error: null,
      success: null
    });
  } catch (err) {
    console.error("Error loading change credentials:", err);
    res.render("admin/change-credentials", {
      username: "",
      error: "Failed to load admin details",
      success: null
    });
  }
};
exports.postChangeCredentials = async (req, res) => {
  const { newUsername, currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "12345678");
    const adminId = decoded.id;

    const [rows] = await db.query("SELECT password FROM admins WHERE id = ?", [adminId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect." });

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ error: "New passwords do not match." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE admins SET username = ?, password = ? WHERE id = ?",
      [newUsername, hashedPassword, adminId]
    );

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
//       admin: res.cookie.admin,
//       social,
//       socialError: null,
//       socialSuccess: null,
//       error: null,
//       success: null
//     });
//   } catch (err) {
//     console.error(err);
//     res.render("admin/dashboard", {
//       admin: res.cookie.admin,
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

