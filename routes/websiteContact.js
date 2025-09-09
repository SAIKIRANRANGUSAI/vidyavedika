const express = require("express");
const router = express.Router();
const db = require("../config/db");

// POST route
router.post("/contact-us/send", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !phone || !message) {
            return res.status(400).send("All fields are required");
        }

        await db.query(
            "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
            [name, email, phone, message]
        );

        // send success response
        //res.send("Message sent successfully!");
        res.redirect("/contact");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
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
        res.render("contact", { getInTouch: {} }); // fallback
    }
});

module.exports = router;
