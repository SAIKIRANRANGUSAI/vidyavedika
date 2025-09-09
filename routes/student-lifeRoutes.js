const express = require("express");
const router = express.Router();
const db = require("../config/db"); // path to your db.js

// GET /student-life
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM hostel_accommodation LIMIT 1");

    // fallback if table is empty
    const studentLife = rows.length
      ? rows[0]
      : {
          main_heading: "Hostel & Accommodation",
          main_description: "We provide a safe, comfortable, and well-managed hostel facility...",
          final_description: "Our hostel is not just an accommodation—it is a nurturing space where students can focus, grow, and achieve their goals.",
          item1_heading: "Comfortable Living",
          item1_description: "Spacious, well-ventilated AC and Non-AC rooms designed to create a pleasant study atmosphere.",
          item1_image: "images/examination-icon-1.png",
          item2_heading: "Safety & Security",
          item2_description: "24x7 security, CCTV surveillance, and wardens to ensure student safety and discipline.",
          item2_image: "images/examination-icon-2.png",
          item3_heading: "Healthy Dining",
          item3_description: "Nutritious and hygienic meals provided in the hostel mess to support students’ health and concentration.",
          item3_image: "images/examination-icon-3.png",
          item4_heading: "Study Environment",
          item4_description: "Dedicated study hours, supervised preparation time, and a quiet, disciplined environment.",
          item4_image: "images/examination-icon-4.png",
          item5_heading: "Parental Comfort",
          item5_description: "Regular updates and open communication with parents about hostel facilities and student well-being.",
          item5_image: "images/examination-icon-5.png",
        };
        const [rows1] = await db.query("SELECT * FROM library_labs ORDER BY id DESC LIMIT 1");
        const library = rows.length ? rows1[0] : {
            heading: "Library & Labs",
            description: "At Vidya Vedika IIT & NEET Academy, we provide world-class learning resources and facilities to enhance both theoretical knowledge and practical understanding.",
            long_description: `
                <ul class="ul-check fs-500">
                    <li><strong>Library</strong> – A well-stocked library with textbooks, reference materials, competitive exam guides, journals, and digital resources to support in-depth learning and research. A quiet and motivating space is maintained for focused study.</li>
                    <li><strong>Science Labs</strong> – Fully equipped Physics, Chemistry, and Biology labs designed to give students hands-on experience and strengthen their practical skills.</li>
                    <li><strong>Digital Learning</strong> – Access to e-learning resources and practice materials to complement classroom teaching.</li>
                </ul>
            `
        };
        const [rows2] = await db.query('SELECT * FROM sports_extracurriculars LIMIT 1');
        const sports = rows2[0] || {};
        const [rows3] = await db.query('SELECT * FROM cultural_activities LIMIT 1');
        const cultural = rows3[0] || {};
       

    res.render("student-life", { studentLife, library, sports, cultural }); // ✅ PASS variable to EJS
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
