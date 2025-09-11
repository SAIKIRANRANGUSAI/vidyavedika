const path = require("path");
const fs = require("fs");
const db = require("../../config/db");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const adminController = require("../controllers/adminController");
router.use(adminController.isAuthenticated);

// ------------------- Courses -------------------

// Upload folder for courses
const uploadCoursesDir = path.join(__dirname, "../../public/uploads/courses");
if (!fs.existsSync(uploadCoursesDir)) fs.mkdirSync(uploadCoursesDir, { recursive: true });

// Multer for courses
const coursesStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadCoursesDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const uploadCourses = multer({ storage: coursesStorage });

// GET Course page (admin)
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM course_section LIMIT 1");
        const section = rows.length ? rows[0] : {};

        const [courses] = await db.query("SELECT * FROM courses ORDER BY id DESC");

        // Fetch course views
        const [courseViews] = await db.query(
            "SELECT cv.*, c.heading AS course_heading FROM course_view cv LEFT JOIN courses c ON cv.course_id = c.id ORDER BY cv.id DESC"
        );

        res.render("course", { section, courses, courseViews });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading page");
    }
});

// Save course section
router.post("/save", async (req, res) => {
    try {
        const { main_heading, main_description } = req.body;
        const [rows] = await db.query("SELECT id FROM course_section LIMIT 1");

        if (rows.length) {
            await db.query(
                "UPDATE course_section SET main_heading=?, main_description=? WHERE id=?",
                [main_heading, main_description, rows[0].id]
            );
        } else {
            await db.query(
                "INSERT INTO course_section (main_heading, main_description) VALUES (?, ?)",
                [main_heading, main_description]
            );
        }

        res.redirect("/admin/course");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Add new course
router.post("/add", uploadCourses.single("image"), async (req, res) => {
    try {
        const { heading, description } = req.body;
        const image = req.file ? "/uploads/courses/" + req.file.filename : null;

        await db.query(
            "INSERT INTO courses (heading, description, image) VALUES (?, ?, ?)",
            [heading, description, image]
        );
        res.redirect("/admin/course");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Edit course
router.post("/edit/:id", uploadCourses.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { heading, description } = req.body;

        if (req.file) {
            const image = "/uploads/courses/" + req.file.filename;

            // Delete old image
            const [oldRows] = await db.query("SELECT image FROM courses WHERE id=?", [id]);
            if (oldRows.length && oldRows[0].image) {
                const oldPath = path.join(__dirname, "../../public", oldRows[0].image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            await db.query(
                "UPDATE courses SET heading=?, description=?, image=? WHERE id=?",
                [heading, description, image, id]
            );
        } else {
            await db.query(
                "UPDATE courses SET heading=?, description=? WHERE id=?",
                [heading, description, id]
            );
        }

        res.redirect("/admin/course");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Delete course
router.post("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query("SELECT image FROM courses WHERE id=?", [id]);
        if (rows.length && rows[0].image) {
            const filePath = path.join(__dirname, "../../public", rows[0].image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.query("DELETE FROM courses WHERE id=?", [id]);
        res.redirect("/admin/course");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// ------------------- Course Views -------------------

// Upload folder for course views
const uploadCourseViewDir = path.join(__dirname, "../../public/uploads/course-view");
if (!fs.existsSync(uploadCourseViewDir)) fs.mkdirSync(uploadCourseViewDir, { recursive: true });

// Multer for course views
const courseViewStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadCourseViewDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const uploadCourseView = multer({ storage: courseViewStorage });

// GET Course View admin page
router.get("/view", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM course_section LIMIT 1");
        const section = rows.length ? rows[0] : {};

        const [courses] = await db.query("SELECT * FROM courses ORDER BY id DESC");
        const [courseViews] = await db.query(
            "SELECT cv.*, c.heading AS course_heading FROM course_view cv LEFT JOIN courses c ON cv.course_id = c.id ORDER BY cv.id DESC"
        );

        res.render("course", { section, courses, courseViews });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Add Course View
router.post("/view/add", uploadCourseView.single("banner_image"), async (req, res) => {
    try {
        const { course_id, content } = req.body;
        const banner_image = req.file ? "/uploads/course-view/" + req.file.filename : null;

        await db.query(
            "INSERT INTO course_view (course_id, banner_image, content) VALUES (?, ?, ?)",
            [course_id, banner_image, content]
        );
        res.redirect("/admin/course/view");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Edit Course View
router.post("/view/edit/:id", uploadCourseView.single("banner_image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, content } = req.body;

        if (req.file) {
            const banner_image = "/uploads/course-view/" + req.file.filename;

            // Delete old banner image
            const [oldRows] = await db.query("SELECT banner_image FROM course_view WHERE id=?", [id]);
            if (oldRows.length && oldRows[0].banner_image) {
                const oldPath = path.join(__dirname, "../../public", oldRows[0].banner_image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            await db.query(
                "UPDATE course_view SET course_id=?, content=?, banner_image=? WHERE id=?",
                [course_id, content, banner_image, id]
            );
        } else {
            await db.query(
                "UPDATE course_view SET course_id=?, content=? WHERE id=?",
                [course_id, content, id]
            );
        }

        res.redirect("/admin/course/view");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// Delete Course View
router.post("/view/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query("SELECT banner_image FROM course_view WHERE id=?", [id]);
        if (rows.length && rows[0].banner_image) {
            const filePath = path.join(__dirname, "../../public", rows[0].banner_image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.query("DELETE FROM course_view WHERE id=?", [id]);
        res.redirect("/admin/course/view");
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

module.exports = router;
