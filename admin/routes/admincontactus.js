const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

//const db = require("../../config/db");

const db = require("../../config/db");
router.use(adminController.isAuthenticated);
// GET dashboard with both sections
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;

        const [contactRows] = await db.query("SELECT * FROM get_in_touch LIMIT 1");
        const contactUs = contactRows[0] || {};

        const [detailsRows] = await db.query("SELECT * FROM contact_details LIMIT 1");
        const contactDetails = detailsRows[0] || {};

        // total messages
        const [countRows] = await db.query("SELECT COUNT(*) AS total FROM contact_messages");
        const totalMessages = countRows[0].total;
        const totalPages = Math.ceil(totalMessages / limit);

        // fetch only 5 messages per page
        const [messages] = await db.query(
            `SELECT *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS date_time
             FROM contact_messages
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.render("dashboard", {
            contactUs,
            contactDetails,
            username: "Admin User",
            messages,          // only 5 messages per page
            currentPage: page,
            totalPages
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});
// POST save Contact Us heading & description
router.post("/save", async (req, res) => {
    try {
        const { heading, description } = req.body;
        const [existing] = await db.query("SELECT id FROM get_in_touch LIMIT 1");

        if (existing.length > 0) {
            await db.query(
                "UPDATE get_in_touch SET heading = ?, description = ? WHERE id = ?",
                [heading, description, existing[0].id]
            );
        } else {
            await db.query(
                "INSERT INTO get_in_touch (heading, description) VALUES (?, ?)",
                [heading, description]
            );
        }

        res.redirect("/admin/contactus");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// POST save Contact Details
router.post("/contact-details/save", async (req, res) => {
    try {
        const data = {
            location_heading: req.body.location_heading,
            location_text: req.body.location_text,
            phone_heading: req.body.phone_heading,
            phone_number: req.body.phone_number,
            email_heading: req.body.email_heading,
            email_address: req.body.email_address,
        };

        const [existing] = await db.query("SELECT id FROM contact_details LIMIT 1");

        if (existing.length > 0) {
            await db.query("UPDATE contact_details SET ? WHERE id = ?", [data, existing[0].id]);
        } else {
            await db.query("INSERT INTO contact_details SET ?", [data]);
        }

        res.redirect("/admin/contactus");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// ---------------- POST Contact Message from Website ----------------
// router.post("/send", async (req, res) => {
//     try {
//         const { name, email, phone, message } = req.body;
//         await db.query(
//             "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)",
//             [name, email, phone, message]
//         );
//         res.redirect("/thank-you"); // or redirect back to form with success
//     } catch (err) {
//         console.error("Error saving contact message:", err);
//         res.status(500).send("Database error");
//     }
// });

// Save messages from website
router.post("/contact-us/send", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !phone || !message) {
            return res.status(400).send("All fields are required");
        }

        const sql = "INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)";
        await db.query(sql, [name, email, phone, message]);

        res.send("Message sent successfully"); // or you can redirect back
    } catch (err) {
        console.error("DB insert error:", err);
        res.status(500).send("Database error");
    }
});// ---------------- DELETE Message from Admin ----------------
router.post("/messages/delete/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await db.query("DELETE FROM contact_messages WHERE id = ?", [id]);
        res.redirect("/admin/contactus");
    } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).send("Database error");
    }
});


module.exports = router;

