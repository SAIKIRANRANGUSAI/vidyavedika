const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "public/uploads/hostel";
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const sportsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "public/uploads/sports";
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploadSports = multer({ storage: sportsStorage });


// Multer setup for Cultural Activities
const culturalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "public/uploads/cultural";
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploadCultural = multer({ storage: culturalStorage });
// ---------------- GET Hostel & Accommodation ----------------
// GET Student Life page
router.get("/", async (req, res) => {
    try {
        // Fetch Hostel & Accommodation
        const [hostelRows] = await db.query("SELECT * FROM hostel_accommodation LIMIT 1");
        const hostel = hostelRows[0] || {};  // empty object if nothing

        // Fetch Library & Labs
        const [libraryRows] = await db.query("SELECT * FROM library_labs LIMIT 1");
        const library = libraryRows[0] || {};  // empty object if nothing

        const [rows] = await db.query("SELECT * FROM sports_extracurriculars LIMIT 1");
        const section = rows[0] || {};

        const [rows1] = await db.query("SELECT * FROM cultural_activities LIMIT 1");
        const cultural = rows1[0] || {};

        // Render the EJS, send variables
        res.render("student-life_s", {
            hostel: hostel,    // now matches your EJS template
            lb: library,
            section,
            cultural
        });


    } catch (err) {
        console.error("Error loading page:", err);
        res.status(500).send("Server error");
    }
});


// ---------------- POST Save Section ----------------
router.post("/save", upload.fields([
    { name: "item1_image" },
    { name: "item2_image" },
    { name: "item3_image" },
    { name: "item4_image" },
    { name: "item5_image" }
]), async (req, res) => {
    try {
        const data = {
            main_heading: req.body.main_heading,
            main_description: req.body.main_description,
            final_description: req.body.final_description,
        };

        // Handle 5 items with heading, description, image
        for (let i = 1; i <= 5; i++) {
            data[`item${i}_heading`] = req.body[`item${i}_heading`] || null;
            data[`item${i}_description`] = req.body[`item${i}_description`] || null;

            if (req.files[`item${i}_image`] && req.files[`item${i}_image`][0]) {
                data[`item${i}_image`] = "/uploads/hostel/" + req.files[`item${i}_image`][0].filename;
            }
        }

        const [existing] = await db.query("SELECT id FROM hostel_accommodation LIMIT 1");
        if (existing.length > 0) {
            // Update existing record
            await db.query("UPDATE hostel_accommodation SET ? WHERE id = ?", [data, existing[0].id]);
        } else {
            // Insert new record
            await db.query("INSERT INTO hostel_accommodation SET ?", [data]);
        }

        res.redirect("/admin/student-life"); // redirect to page
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});


// ---------------- POST Library & Labs Save ----------------
router.post("/save-library", async (req, res) => {
    try {
        // Prepare data for Library & Labs
        const data = {
            heading: req.body.heading || "",
            description: req.body.description || "",
            long_description: req.body.long_description || ""
        };

        // Check if a record already exists
        const [existing] = await db.query("SELECT id FROM library_labs LIMIT 1");
        if (existing.length > 0) {
            // Update existing record
            await db.query("UPDATE library_labs SET ? WHERE id = ?", [data, existing[0].id]);
        } else {
            // Insert new record
            await db.query("INSERT INTO library_labs SET ?", [data]);
        }

        res.redirect("/admin/student-life"); // redirect back to the page
    } catch (err) {
        console.error("Library save error:", err);
        res.status(500).send("Database error");
    }
});

//POST Save Sports & Extracurriculars
router.post("/save-sports", uploadSports.fields([
    { name: "image1" },
    { name: "image2" }
]), async (req, res) => {
    try {
        const data = {
            heading: req.body.heading,
            description: req.body.description
        };

        if (req.files['image1'] && req.files['image1'][0]) {
            data.image1 = "/uploads/sports/" + req.files['image1'][0].filename;
        }
        if (req.files['image2'] && req.files['image2'][0]) {
            data.image2 = "/uploads/sports/" + req.files['image2'][0].filename;
        }

        const [existing] = await db.query("SELECT id FROM sports_extracurriculars LIMIT 1");
        if (existing.length > 0) {
            await db.query("UPDATE sports_extracurriculars SET ? WHERE id = ?", [data, existing[0].id]);
        } else {
            await db.query("INSERT INTO sports_extracurriculars SET ?", [data]);
        }

        res.redirect("/admin/student-life");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// POST Save Cultural Activities
router.post("/save-cultural", uploadCultural.fields([
    { name: "activity_image1" },
    { name: "activity_image2" }
]), async (req, res) => {
    try {
        const data = {
            activity_heading: req.body.activity_heading,
            activity_description: req.body.activity_description
        };

        if (req.files['activity_image1'] && req.files['activity_image1'][0]) {
            data.activity_image1 = "/uploads/cultural/" + req.files['activity_image1'][0].filename;
        }
        if (req.files['activity_image2'] && req.files['activity_image2'][0]) {
            data.activity_image2 = "/uploads/cultural/" + req.files['activity_image2'][0].filename;
        }

        const [existing] = await db.query("SELECT id FROM cultural_activities LIMIT 1");
        if (existing.length > 0) {
            await db.query("UPDATE cultural_activities SET ? WHERE id = ?", [data, existing[0].id]);
        } else {
            await db.query("INSERT INTO cultural_activities SET ?", [data]);
        }

        res.redirect("/admin/student-life");
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});


module.exports = router;
