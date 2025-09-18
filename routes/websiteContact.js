const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");

// Utility: sanitize dangerous input
function sanitizeInput(str) {
  if (!str) return "";
  return String(str)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\b(alert|confirm|prompt|eval|Function)\s*\([\s\S]*?\)/gi, "")
    .trim();
}

// POST route with CAPTCHA & sanitization
router.post("/contact-us/send", async (req, res) => {
  try {
    const { name, email, phone, message, "g-recaptcha-response": captcha } = req.body;

    if (!name || !email || !phone || !message || !captcha) {
      return res.status(400).send("All fields including CAPTCHA are required");
    }

    // Verify CAPTCHA
    // const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const secretKey = "6Lf2Mc0rAAAAAPZYg9MHRyVvKE2IQgLBMAqrUaaL";

    const captchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`
    );

    if (!captchaVerify.data.success) {
      return res.status(400).send("CAPTCHA verification failed");
    }

    // Sanitize inputs
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);
    const cleanPhone = sanitizeInput(phone);
    const cleanMessage = sanitizeInput(message);

    await db.query(
      "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
      [cleanName, cleanEmail, cleanPhone, cleanMessage]
    );

    res.redirect("/contact");
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).send("Server error");
  }
});

router.get("/contact", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM get_in_touch LIMIT 1");
    const getInTouch = rows.length ? rows[0] : {};
    const [rows1] = await db.query("SELECT * FROM contact_details LIMIT 1");
    const contactDetails = rows1[0] || {};
    res.render("contact", { getInTouch, contactDetails });
  } catch (err) {
    console.error(err);
    res.render("contact", { getInTouch: {}, contactDetails: {} });
  }
});

module.exports = router;

