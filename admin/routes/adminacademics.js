const express = require("express");
const adminController = require("../controllers/adminController");
const router = express.Router();
const db = require("../../config/db");
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary = require("../../config/cloudinary");
const path = require("path");
router.use(adminController.isAuthenticated);
//router.use(adminController.isAuthenticated);
// Multer setup
// const storage = multer.diskStorage({
//     destination: (_req, file, cb) => cb(null, path.join(__dirname, '../../public/images')),
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// Apply authentication middleware to all routes


/* ===============================
   GET Academics Main Page
================================= */
router.get("/", async (req, res) => {
    try {
        const [academicsRows] = await db.query("SELECT * FROM academics_section LIMIT 1");
        const academics = academicsRows[0] || {};

        const [calendarRows] = await db.query("SELECT * FROM academic_calendar LIMIT 1");
        const calendar = calendarRows[0] || {};

        const [sectionRows] = await db.query("SELECT * FROM exam_section LIMIT 1");
        const section = sectionRows[0] || {};

        const [admissionsRows] = await db.query("SELECT * FROM admissions_section LIMIT 1");
        const admissions = admissionsRows[0] || {};

        res.render("academic_s", { academics, calendar, section, admissions });
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).send("Error loading page");
    }
});

/* ===============================
   SAVE Academics Section
================================= */
router.post("/academics/save", upload.single("image"), async (req, res) => {
    try {
        const { heading, sub_heading, list_content } = req.body;
        let imagePath = null;

        if (req.file) {
            // Upload image to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'vidyavedika/academics' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            imagePath = result.secure_url;
        }

        const [rows] = await db.query("SELECT id FROM academics_section LIMIT 1");

        if (rows.length) {
            await db.query(
                `UPDATE academics_section 
                 SET heading=?, sub_heading=?, list_content=?, image=COALESCE(?, image) 
                 WHERE id=?`,
                [heading, sub_heading, list_content, imagePath, rows[0].id]
            );
        } else {
            await db.query(
                `INSERT INTO academics_section (heading, sub_heading, list_content, image)
                 VALUES (?, ?, ?, ?)`,
                [heading, sub_heading, list_content, imagePath]
            );
        }

        res.redirect("/admin/academics");
    } catch (err) {
        console.error("Error saving academics:", err);
        res.status(500).send("Database error");
    }
});

/* ===============================
   SAVE Exam Section
================================= */
router.post("/exam/save", upload.fields([
    { name: "item1_image" }, { name: "item2_image" },
    { name: "item3_image" }, { name: "item4_image" },
    { name: "item5_image" }
]), async (req, res) => {
    try {
        const { main_heading, main_description, final_description } = req.body;

        const items = {};

        for (let i = 1; i <= 5; i++) {
            items[`item${i}_title`] = req.body[`item${i}_title`] || null;
            items[`item${i}_description`] = req.body[`item${i}_description`] || null;

            if (req.files[`item${i}_image`]) {
                const file = req.files[`item${i}_image`][0];
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: `vidyavedika/exam_section` },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                items[`item${i}_image`] = result.secure_url;
            } else {
                items[`item${i}_image`] = null;
            }
        }

        const [rows] = await db.query("SELECT id FROM exam_section LIMIT 1");

        if (rows.length) {
            await db.query(
                `UPDATE exam_section SET 
                 main_heading=?, main_description=?, final_description=?,
                 item1_title=?, item1_description=?, item1_image=COALESCE(?, item1_image),
                 item2_title=?, item2_description=?, item2_image=COALESCE(?, item2_image),
                 item3_title=?, item3_description=?, item3_image=COALESCE(?, item3_image),
                 item4_title=?, item4_description=?, item4_image=COALESCE(?, item4_image),
                 item5_title=?, item5_description=?, item5_image=COALESCE(?, item5_image)
                 WHERE id=?`,
                [
                    main_heading, main_description, final_description,
                    items.item1_title, items.item1_description, items.item1_image,
                    items.item2_title, items.item2_description, items.item2_image,
                    items.item3_title, items.item3_description, items.item3_image,
                    items.item4_title, items.item4_description, items.item4_image,
                    items.item5_title, items.item5_description, items.item5_image,
                    rows[0].id
                ]
            );
        } else {
            await db.query(
                `INSERT INTO exam_section 
                 (main_heading, main_description, final_description,
                  item1_title, item1_description, item1_image,
                  item2_title, item2_description, item2_image,
                  item3_title, item3_description, item3_image,
                  item4_title, item4_description, item4_image,
                  item5_title, item5_description, item5_image)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    main_heading, main_description, final_description,
                    items.item1_title, items.item1_description, items.item1_image,
                    items.item2_title, items.item2_description, items.item2_image,
                    items.item3_title, items.item3_description, items.item3_image,
                    items.item4_title, items.item4_description, items.item4_image,
                    items.item5_title, items.item5_description, items.item5_image
                ]
            );
        }

        res.redirect("/admin/academics");
    } catch (err) {
        console.error("Error saving exam section:", err);
        res.status(500).send("Database error");
    }
});
/* ===============================
   SAVE Admissions Section
================================= */
router.post("/admissions/save", upload.fields([
    { name: "image1" }, { name: "image2" }, { name: "image3" }
]), async (req, res) => {
    try {
        const { heading, description } = req.body;
        const images = {};

        // Upload each image to Cloudinary if provided
        for (const img of ["image1", "image2", "image3"]) {
            if (req.files[img]) {
                const file = req.files[img][0];
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "vidyavedika/admissions_section" },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                images[img] = result.secure_url;
            } else {
                images[img] = null;
            }
        }

        const [rows] = await db.query("SELECT id FROM admissions_section LIMIT 1");

        if (rows.length) {
            await db.query(
                `UPDATE admissions_section SET heading=?, description=?,
                 image1=COALESCE(?, image1),
                 image2=COALESCE(?, image2),
                 image3=COALESCE(?, image3)
                 WHERE id=?`,
                [heading, description, images.image1, images.image2, images.image3, rows[0].id]
            );
        } else {
            await db.query(
                `INSERT INTO admissions_section
                 (heading, description, image1, image2, image3)
                 VALUES (?, ?, ?, ?, ?)`,
                [heading, description, images.image1, images.image2, images.image3]
            );
        }

        res.redirect("/admin/academics");
    } catch (err) {
        console.error("Error saving admissions:", err);
        res.status(500).send("Database error");
    }
});

/* ===============================
   SAVE Academic Calendar
================================= */
router.post("/calendar/save", async (req, res) => {
    try {
        const { heading, description, content } = req.body;

        const [rows] = await db.query("SELECT id FROM academic_calendar LIMIT 1");

        if (rows.length) {
            await db.query(
                `UPDATE academic_calendar 
                 SET heading=?, description=?, content=?
                 WHERE id=?`,
                [heading, description, content, rows[0].id]
            );
        } else {
            await db.query(
                `INSERT INTO academic_calendar (heading, description, content)
                 VALUES (?, ?, ?)`,
                [heading, description, content]
            );
        }

        res.redirect("/admin/academics");
    } catch (err) {
        console.error("Error saving calendar:", err);
        res.status(500).send("Database error");
    }
});

module.exports = router;