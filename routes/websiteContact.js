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

module.exports = router;
