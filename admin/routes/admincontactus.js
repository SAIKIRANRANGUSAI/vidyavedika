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
      location_heading: req.body.location_heading?.trim(),
      location_text: req.body.location_text?.trim(),
      phone_heading: req.body.phone_heading?.trim(),
      phone_number: req.body.phone_number?.trim(), // may contain multiple numbers
      email_heading: req.body.email_heading?.trim(),
      email_address: req.body.email_address?.trim(),
    };

    // ✅ Phone validation (allow multiple numbers separated by commas)
    const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
    const phoneNumbers = data.phone_number.split(",").map(num => num.trim());

    for (let num of phoneNumbers) {
      if (!phoneRegex.test(num)) {
        return res.status(400).json({
          success: false,
          message: `Invalid phone number: ${num}. Example: +919876543210 or 9876543210`,
        });
      }
    }

    // ✅ Email validation (multiple emails allowed, separated by commas)
    const emails = data.email_address.split(",").map(e => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let email of emails) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: `Invalid email address: ${email}`,
        });
      }
    }

    // ✅ Insert or Update contact_details
    const [existing] = await db.query("SELECT id FROM contact_details LIMIT 1");

    if (existing.length > 0) {
      await db.query("UPDATE contact_details SET ? WHERE id = ?", [data, existing[0].id]);
    } else {
      await db.query("INSERT INTO contact_details SET ?", [data]);
    }

    return res.json({
      success: true,
      message: "Contact details updated successfully!",
    });
  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({
      success: false,
      message: "Database error. Please try again later.",
    });
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


