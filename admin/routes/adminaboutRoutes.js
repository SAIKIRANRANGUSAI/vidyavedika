const express = require("express");



const router = express.Router();
const db = require("../../config/db");
const multer = require("multer");
const path = require("path");

const adminController = require("../controllers/adminController");
router.use(adminController.isAuthenticated);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/images')); // must be inside public
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });


router.get("/about-us", async (req, res) => {
    try {
        const [aboutRows] = await db.query("SELECT * FROM about_us WHERE id = 1");
        const [vmRows] = await db.query("SELECT * FROM vision_mission WHERE id = 1");
        const [teamRows] = await db.query("SELECT * FROM team_section WHERE id = 1");
        const [memberRows] = await db.query("SELECT * FROM team_members ORDER BY id DESC");
        const [mdRows] = await db.query("SELECT * FROM managing_director_message WHERE id = 1");
        const [journeyRows] = await db.query("SELECT * FROM journey_history WHERE id = 1");
        const [rows] = await db.query('SELECT * FROM accreditations_achievements WHERE id = 1');
        const [whyChooseUsRows] = await db.query("SELECT * FROM why_choose_us WHERE id = 1");

        res.render("about_us", {
            about: aboutRows.length ? aboutRows[0] : { heading: "", paragraph1: "", paragraph2: "" },
            vm: vmRows.length ? vmRows[0] : { vision_heading: "", vision_text: "", mission_heading: "", mission_text: "" },
            team: teamRows.length ? teamRows[0] : { heading: "", description: "" },
            members: memberRows,
            message: mdRows.length ? mdRows[0] : {},
            journey: journeyRows.length ? journeyRows[0] : {},
            acc: rows.length ? rows[0] : {},
            whyChooseUs: whyChooseUsRows.length ? whyChooseUsRows[0] : {}

        });
    } catch (err) {
        console.error(err);
        res.send("Error loading About Us / Vision & Mission / Team Section data");
    }
});


// POST About Us update
router.post(
    "/about-us",
    upload.fields([{ name: "image1" }, { name: "image2" }]),
    async (req, res) => {
        try {
            const { heading, paragraph1, paragraph2 } = req.body;

            let image1 = null;
            let image2 = null;

            if (req.files.image1) {
                image1 = "/images/" + req.files.image1[0].filename;
            }
            if (req.files.image2) {
                image2 = "/images/" + req.files.image2[0].filename;
            }

            await db.query(
                `UPDATE about_us 
                 SET heading = ?, paragraph1 = ?, paragraph2 = ?, 
                     image1 = COALESCE(?, image1), 
                     image2 = COALESCE(?, image2) 
                 WHERE id = 1`,
                [heading, paragraph1, paragraph2, image1, image2]
            );

            res.redirect("/admin/about-us"); // ✅ fixed redirect
        } catch (err) {
            console.error(err);
            res.send("Error updating About Us data");
        }
    }
);

/* ======================
   POST Vision & Mission Update
====================== */
router.post(
    "/vision-mission",
    upload.fields([{ name: "vision_image" }, { name: "mission_image" }]),
    async (req, res) => {
        try {
            const { vision_heading, vision_text, mission_heading, mission_text } = req.body;

            let vision_image = null;
            let mission_image = null;

            if (req.files.vision_image) {
                vision_image = "/images/" + req.files.vision_image[0].filename;
            }
            if (req.files.mission_image) {
                mission_image = "/images/" + req.files.mission_image[0].filename;
            }

            await db.query(
                `UPDATE vision_mission 
                 SET vision_heading = ?, vision_text = ?, 
                     mission_heading = ?, mission_text = ?, 
                     vision_image = COALESCE(?, vision_image), 
                     mission_image = COALESCE(?, mission_image) 
                 WHERE id = 1`,
                [vision_heading, vision_text, mission_heading, mission_text, vision_image, mission_image]
            );

            res.redirect("/admin/about-us");  // ✅ stay on same page
        } catch (err) {
            console.error(err);
            res.send("Error updating Vision & Mission data");
        }
    }
);
// POST Team Section (update or insert if missing)
router.post("/team-section", async (req, res) => {
    try {
        console.log("POST /admin/team-section body:", req.body);

        const heading = req.body.heading ? req.body.heading.trim() : "";
        const description = req.body.description ? req.body.description.trim() : "";

        // Try update first
        const [result] = await db.query(
            "UPDATE team_section SET heading = ?, description = ? WHERE id = 1",
            [heading, description]
        );

        // If no rows updated, insert a new row with id = 1
        if (result.affectedRows === 0) {
            await db.query(
                "INSERT INTO team_section (id, heading, description) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE heading = VALUES(heading), description = VALUES(description)",
                [heading, description]
            );
        }

        // Redirect back to the combined admin page so admin sees updated content
        return res.redirect("/admin/about-us");
    } catch (err) {
        console.error("Error updating Team Section:", err);
        res.status(500).send("Error updating Team Section");
    }
});
// only relative paths here, no /admin prefix

// Add Member
router.post("/team-members/add", upload.single("image"), async (req, res) => {
    try {
        const { name, designation } = req.body;
        const imagePath = req.file ? "/images/" + req.file.filename : null;

        await db.query(
            "INSERT INTO team_members (name, designation, image_path) VALUES (?, ?, ?)",
            [name, designation, imagePath]
        );

        res.redirect("/admin/about-us"); // reload page
    } catch (err) {
        console.error("Error adding member:", err);
        res.status(500).send("Error adding team member");
    }
});

// Edit Member
router.post("/team-members/edit/:id", upload.single("image"), async (req, res) => {
    try {
        const { name, designation } = req.body;
        const { id } = req.params;

        // Only replace image if a new file is uploaded
        const imagePath = req.file ? "/images/" + req.file.filename : null;

        await db.query(
            `UPDATE team_members 
       SET name = ?, designation = ?, image_path = COALESCE(?, image_path)
       WHERE id = ?`,
            [name, designation, imagePath, id]
        );

        res.redirect("/admin/about-us");
    } catch (err) {
        console.error("Error editing member:", err);
        res.status(500).send("Error editing team member");
    }
});

// Delete Member
router.post("/team-members/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM team_members WHERE id = ?", [id]);
        res.redirect("/admin/about-us");
    } catch (err) {
        console.error("Error deleting member:", err);
        res.status(500).send("Error deleting team member");
    }
});

router.post("/md-message" ,async (req, res) => {
    try {
        const { title, subtitle, greeting, content, director_name, designation, institute_name } = req.body;

        await db.query(
            `UPDATE managing_director_message
             SET title = ?, subtitle = ?, greeting = ?, content = ?, director_name = ?, designation = ?, institute_name = ?
             WHERE id = 1`,
            [title, subtitle, greeting, content, director_name, designation, institute_name]
        );

        res.redirect("/admin/about-us");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating MD message");
    }
});

router.post('/journey-history', upload.fields([{ name: 'image1' }, { name: 'image2' }]), async (req, res) => {
    try {
        const { heading, description1, description2 } = req.body;
        const images = req.files;

        let updateQuery = 'UPDATE journey_history SET heading = ?, description1 = ?, description2 = ?';
        const params = [heading, description1, description2];

        if (images?.image1) {
            updateQuery += ', image1 = ?';
            params.push('/images/' + images.image1[0].filename);
        }
        if (images?.image2) {
            updateQuery += ', image2 = ?';
            params.push('/images/' + images.image2[0].filename);
        }

        updateQuery += ' WHERE id = 1';
        await db.query(updateQuery, params);

        res.redirect('/admin/about-us');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating Journey / History');
    }
});


router.post('/accreditations-achievements', upload.single('image'), async (req, res) => {
    try {
        const { heading, description } = req.body;
        const imagePath = req.file ? '/images/' + req.file.filename : null;

        let query = `
            INSERT INTO accreditations_achievements (id, heading, description, image)
            VALUES (1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                heading = VALUES(heading),
                description = VALUES(description),
                image = IF(VALUES(image) IS NOT NULL, VALUES(image), image)
        `;

        await db.query(query, [heading, description, imagePath]);

        res.redirect('/admin/about-us');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating Accreditations & Achievements');
    }
});

// --- Middleware: fetch logo for all admin pages ---
router.use(async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT logo FROM settings LIMIT 1");
        res.locals.logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
    } catch (err) {
        console.error("Error fetching logo:", err);
        res.locals.logo = "/admin/static/images/logo.png"; // fallback
    }
    next();
});


// --- Admin Settings Page (upload logo) ---
router.get("/settings", async (req, res) => {
    const [rows] = await db.query("SELECT logo FROM settings LIMIT 1");
    const logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
    res.render("admin/settings", { logo });
});

// --- Update Logo ---
router.post("/settings/update-logo", upload.single("logo"), async (req, res) => {
    try {
        const logoPath = "/uploads/" + req.file.filename;
        await db.query("UPDATE settings SET logo = ? WHERE id = 1", [logoPath]);
        res.redirect("/admin/settings");
    } catch (err) {
        console.error("Error updating logo:", err);
        res.status(500).send("Error updating logo");
    }
});

module.exports = router;
