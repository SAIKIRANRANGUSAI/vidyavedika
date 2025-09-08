const path = require("path");
const fs = require("fs");
const db = require("../../config/db");
const express = require("express");
const router = express.Router();
const multer = require("multer");

// Make sure upload directory exists
const uploadDir = path.join(__dirname, "../../public/uploads/courses");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });


// GET Course page
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM course_section LIMIT 1");
        const section = rows.length ? rows[0] : {};
        const [courses] = await db.query("SELECT * FROM courses ORDER BY id DESC");
        res.render("course", { section, courses });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading page");
    }
});
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
        console.error("Error saving course section:", err);
        res.status(500).send("Database error");
    }
});

// ---------- Add New Course ----------
router.post("/add", upload.single("image"), async (req, res) => {
    try {
        const { heading, description } = req.body;
        const image = req.file ? "/uploads/courses/" + req.file.filename : null;

        await db.query(
            "INSERT INTO courses (heading, description, image) VALUES (?, ?, ?)",
            [heading, description, image]
        );
        res.redirect("/admin/course");
    } catch (err) {
        console.error("Error adding course:", err);
        res.status(500).send("Database error");
    }
});

// ---------- Edit Course ----------
router.post("/edit/:id", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { heading, description } = req.body;
        const image = req.file ? "/uploads/courses/" + req.file.filename : null;

        await db.query("UPDATE courses SET heading=?, description=?, image=COALESCE(?, image) WHERE id=?", [
            heading,
            description,
            image,
            id
        ]);
        res.redirect("/admin/course");
    } catch (err) {
        console.error("Error editing course:", err);
        res.status(500).send("Database error");
    }
});


// ---------- Delete Course ----------
router.post("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Optional: Delete course image from server too
        const [rows] = await db.query("SELECT image FROM courses WHERE id=?", [id]);
        if (rows.length && rows[0].image) {
            const filePath = path.join(__dirname, "../../public", rows[0].image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.query("DELETE FROM courses WHERE id=?", [id]);
        res.redirect("/admin/course");
    } catch (err) {
        console.error("Error deleting course:", err);
        res.status(500).send("Database error");
    }
});

module.exports = router;
