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
            return res.json({ success: false, message: "All fields including CAPTCHA are required" });
        }

        // Verify reCAPTCHA
        const secretKey = "6Lf2Mc0rAAAAAPZYg9MHRyVvKE2IQgLBMAqrUaaL";
        const captchaVerify = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`
        );
        if (!captchaVerify.data.success) {
            return res.json({ success: false, message: "CAPTCHA verification failed" });
        }

        // Multiple emails validation
        const emails = email.split(",").map(e => e.trim());
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (let e of emails) {
            if (!emailRegex.test(e)) {
                return res.json({ success: false, message: `Invalid email: ${e}` });
            }
        }

        // Multiple phone numbers validation
        const phones = phone.split(",").map(p => p.trim());
        const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
        for (let p of phones) {
            if (!phoneRegex.test(p)) {
                return res.json({ success: false, message: `Invalid phone number: ${p}` });
            }
        }

        // Insert message
        await db.query(
            "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
            [name.trim(), email.trim(), phone.trim(), message.trim()]
        );

        return res.json({ success: true, message: "Message sent successfully!" });

    } catch (err) {
        console.error("Contact form error:", err);
        return res.json({ success: false, message: "Server error. Please try again." });
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


