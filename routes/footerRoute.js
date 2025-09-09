const express = require("express");
const router = express.Router();
const db = require("../config/db");

// --- Footer Middleware (fetches logo, contact details, social links) ---
router.use(async (req, res, next) => {
  try {
    // Settings (logo, description, etc.)
    const [settingsRows] = await db.query("SELECT * FROM settings LIMIT 1");
    res.locals.settings = settingsRows[0] || {};

    // // Contact details (location, phone, email)
    // const [contactRows] = await db.query("SELECT * FROM contact_details LIMIT 1");
    // res.locals.contactDetails = contactRows[0] || {};

    // // Social media links
    // const [socialRows] = await db.query("SELECT * FROM admin_social LIMIT 1");
    // res.locals.social = socialRows[0] || {};

    next();
  } catch (err) {
    console.error("Error fetching footer data:", err);
    next();
  }
});

module.exports = router;
