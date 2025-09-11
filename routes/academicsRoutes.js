const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/academics", async (req, res) => {
    try {
        // Fetch Academics Section
        const [academicsRows] = await db.query("SELECT * FROM academics_section ORDER BY id ASC LIMIT 1");
        const academics = academicsRows.length
            ? academicsRows[0]
            : {
                  heading: "Beyond Books, Toward Brilliances",
                  sub_heading: "Vidya Vedika – Nurturing Knowledge, Igniting Success.",
                  list_content: "",
                  image: "/images/academics-img-1.png",
              };

        // Fetch Academic Calendar
        const [calendarRows] = await db.query("SELECT * FROM academic_calendar ORDER BY id ASC LIMIT 1");
        const calendar = calendarRows.length
            ? calendarRows[0]
            : {
                  heading: "Academic Calendar",
                  description: "At Vidya Vedika IIT & NEET Academy, our academic calendar is carefully designed...",
                  content: `
                    <ul>
                        <li><strong>IIT & NEET Coaching</strong> – Parallel to the Board syllabus...</li>
                        <li><strong>Periodic Assessments</strong> – Weekly tests, unit-wise evaluations...</li>
                        <li><strong>Special Focus Sessions</strong> – Time is allocated for workshops...</li>
                        <li><strong>Revisions & Final Preparation</strong> – Dedicated revision slots...</li>
                    </ul>
                    <p>Our well-structured calendar ensures students progress smoothly...</p>
                  `,
              };

        // Fetch Exam Section
        const [examRows] = await db.query("SELECT * FROM exam_section ORDER BY id ASC LIMIT 1");
        const section = examRows.length ? examRows[0] : null;

        // Fetch Admissions Section
        const [admissionsRows] = await db.query("SELECT * FROM admissions_section ORDER BY id ASC LIMIT 1");
        const admissions = admissionsRows.length
            ? admissionsRows[0]
            : {
                  heading: "Admissions Made Simple",
                  description: "Admission Process & Criteria...",
                  image1: "/images/admission-img-1.png",
                  image2: "/images/admission-img-2.png",
                  image3: "/images/admission-img-3.png",
              };

        // Pass all variables to EJS
        res.render("academics", { academics, calendar, section, admissions });
    } catch (err) {
        console.error("Error fetching academics page:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
