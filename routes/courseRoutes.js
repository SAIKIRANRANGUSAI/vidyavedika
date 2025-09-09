const express = require("express");
const router = express.Router();
const db = require("../config/db"); // adjust path if needed

// ✅ List all courses
router.get("/", async (req, res) => {
  try {
    const [courses] = await db.query("SELECT * FROM courses ORDER BY id ASC");

    res.render("courses", { courses }); // create courses.ejs
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).send("Server Error");
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // fetch course info
    const [rows] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).send("Course not found");
    }
    const course = rows[0];

    // fetch course view
    const [views] = await db.query(
      "SELECT * FROM course_view WHERE course_id = ? LIMIT 1",
      [id]
    );
    const courseView = views.length > 0 ? views[0] : null;

    console.log('Course:', course.heading);
    console.log('CourseView:', courseView);

    res.render("course-view", { course, courseView });
  } catch (err) {
    console.error("Error fetching course details:", err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;
