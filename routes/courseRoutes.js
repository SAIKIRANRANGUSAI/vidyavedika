const express = require('express');
const router = express.Router();
const db = require('../config/db'); // your MySQL connection

router.get('/', async (req, res) => {
    try {
        // Fetch course sections from DB
        const [sections] = await db.query("SELECT * FROM course_section ORDER BY id ASC");

        // Optional: fetch other data like CTA or counters if needed
        const [cta] = await db.query("SELECT * FROM cta_table LIMIT 1"); 
        const [counters] = await db.query("SELECT * FROM counters_table");

        // Pass all data to index.ejs
        res.render('index', { sections, cta: cta[0], counters });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
