const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs"); // Use promises version of fs
const multer = require('multer');
//const adminController = require("../controllers/adminController");
const adminController = require('../controllers/adminController');
const db = require("../../config/db");

// Configure Multer for file uploads

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/images')); // save to public/images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext); // unique filename
  }
});

const upload = multer({ storage });

// Use logo middleware for all admin routes
router.use(adminController.getAdminLogo);

// Login page (GET)
router.get("/login", adminController.getLogin);

// Login form (POST)
router.post("/login", adminController.postLogin);

// Dashboard (protected)
router.get("/dashboard", adminController.isAuthenticated, adminController.getDashboard);

// --- Home editor (GET) ---
// --- Home editor (GET) ---
// --- Home editor (GET) ---
router.get("/home", adminController.isAuthenticated, async (req, res) => {
    try {
        // Query the database for the hero section content
        const [homeContentRows] = await db.query("SELECT * FROM home_page_content WHERE id = 1");
        const homeContentData = homeContentRows[0] || {};
        
        // Query the CTA content
        const [ctaContentRows] = await db.query("SELECT * FROM cta_content WHERE id = 1");
        const ctaContentData = ctaContentRows[0] || {};
        
         // 🎯 Query the database for the counters data
        const [counters] = await db.query("SELECT id, label, value FROM counters ORDER BY id ASC");



        const [galleryContentRows] = await db.query("SELECT * FROM gallery_content WHERE id = 1");
        const galleryContentData = galleryContentRows[0] || {};

        const [galleryImages] = await db.query("SELECT * FROM gallery_images ORDER BY id DESC");

        // 🎯 Query for testimonial section content
        const [testimonialContentRows] = await db.query("SELECT * FROM testimonial_content WHERE id = 1");
        const testimonialContentData = testimonialContentRows[0] || {};

        // Fetch Why Choose Us content
        // Fetch Why Choose Us data
        const [whyChooseRows] = await db.query('SELECT * FROM why_choose_us WHERE id = 1');
        const whyChooseUs = whyChooseRows[0] || {};

        // 🎯 Query for individual testimonials
        const [testimonialsRows] = await db.query("SELECT * FROM testimonials ORDER BY id");
        const testimonialsData = testimonialsRows || [];

        // Inside /admin/home GET route
        const [galleryRows] = await db.query("SELECT * FROM gallery_content WHERE id = 1");
        let galleryContent = galleryRows[0] || { heading: "", description: "" };


        // Query the database to get all courses
        const [courses] = await db.query(
            "SELECT c.id, c.name, c.slug, IFNULL(i.file_path, '/images/default.png') AS icon FROM courses c LEFT JOIN other_images i ON c.icon_image_id = i.id"
        );

        // Construct the data object to be passed to the view
        const viewData = {
            homeContent: {
                heading: homeContentData.heading || "",
                sub_heading: homeContentData.sub_heading || "",
                description: homeContentData.description || "",
                banner_image_paths: homeContentData.banner_image_paths || []
            },
            // 🎯 CORRECT CTA DATA HERE
            cta: {
                cta_heading: ctaContentData.cta_heading || "",
                cta_text: ctaContentData.cta_text || "",
                cta_image_path: ctaContentData.cta_image_path || ""
            },
            counters,
            galleryContent,
            galleryImages,
            whyChooseUs,

            galleryContent: {
                heading: galleryContentData.heading || "",
                description: galleryContentData.description || ""
            },
            
            // REMOVE THIS DUPLICATE cta KEY ❌
            // cta: { title: "", button_text: "", button_link: "", updated_at: null }, 
            testimonialsContent: {
                heading: testimonialContentData.heading || "",
                description: testimonialContentData.description || ""
            },
            testimonials: testimonialsData
        };

        // Render the EJS template with the data
        res.render("home", viewData);
    } catch (err) {
        console.error("Home load error:", err);
        res.status(500).send("An error occurred while loading the page.");
    }
});
// --- Home hero section (POST) ---
// --- Home hero section (POST) ---
router.post("/home/hero", adminController.isAuthenticated, upload.array("banner_images"), async (req, res) => {
    const { heading, sub_heading, description } = req.body;
    const newFiles = req.files || [];

    try {
        // 1. Get the current image paths from the database
        // This is the correct way to handle data from a JSON column
        const [homeContentRows] = await db.query("SELECT banner_image_paths FROM home_page_content WHERE id = 1");
        const currentPaths = (homeContentRows[0] && homeContentRows[0].banner_image_paths) || [];

        // 2. Create paths for the newly uploaded images
        const newPaths = newFiles.map(file => `/images/${file.filename}`);

        // 3. Combine the old and new image paths
        const updatedPaths = [...currentPaths, ...newPaths];

        // 4. Update the database with the new data
        await db.query(
            "UPDATE home_page_content SET heading = ?, sub_heading = ?, description = ?, banner_image_paths = ? WHERE id = 1",
            [heading, sub_heading, description, JSON.stringify(updatedPaths)]
        );

        res.redirect("/admin/home");

    } catch (err) {
        console.error("Home hero update error:", err);
        // ... (error handling for file cleanup)
    }
});// --- Home hero image delete (GET) ---
router.get("/home/hero/delete-image", adminController.isAuthenticated, async (req, res) => {
    const imagePath = req.query.path;

    if (!imagePath) {
        return res.status(400).send("Image path is required.");
    }

    try {
        // 1. Get the current image paths from the database
        const [homeContentRows] = await db.query("SELECT banner_image_paths FROM home_page_content WHERE id = 1");
        // Access the data directly. It is already a JS array.
        const currentPaths = (homeContentRows[0] && homeContentRows[0].banner_image_paths) || [];

        // 2. Filter out the path to be deleted
        const updatedPaths = currentPaths.filter(p => p !== imagePath);

        // 3. Update the database (convert the JS array back to a JSON string)
        await db.query(
            "UPDATE home_page_content SET banner_image_paths = ? WHERE id = 1",
            [JSON.stringify(updatedPaths)]
        );

        // 4. Delete the file from the server
        const filePath = path.join(__dirname, "../../public", imagePath);
        await fs.unlink(filePath);

        // 5. Redirect back to the home page
        res.redirect("/admin/home");
    } catch (err) {
        console.error("Image delete error:", err);
        res.status(500).send("Server error occurred while deleting the image.");
    }
});

// --- CTA update (POST) ---
router.post("/home/cta", adminController.isAuthenticated, upload.single("cta_image"), async (req, res) => {
    const { cta_heading, cta_text } = req.body;
    const newFile = req.file;
    let newImagePath = null;

    try {
        // 1. Get the current CTA image path from the database
        const [ctaContentRows] = await db.query("SELECT cta_image_path FROM cta_content WHERE id = 1");
        const currentImagePath = ctaContentRows[0]?.cta_image_path;

        if (newFile) {
            // New file was uploaded, so update the path and delete the old one
            newImagePath = `/images/${newFile.filename}`;
            if (currentImagePath) {
                const oldFilePath = path.join(__dirname, "../../public", currentImagePath);
                await fs.unlink(oldFilePath).catch(err => console.error("Failed to delete old CTA image:", err));
            }
        } else {
            // No new file, keep the old path
            newImagePath = currentImagePath;
        }

        // 2. Update the database with the new data
        await db.query(
            "UPDATE cta_content SET cta_heading = ?, cta_text = ?, cta_image_path = ? WHERE id = 1",
            [cta_heading, cta_text, newImagePath]
        );

        res.redirect("/admin/home");
    } catch (err) {
        console.error("CTA update error:", err);
        if (newFile) { // Clean up if an error occurred after upload
            await fs.unlink(newFile.path).catch(err => console.error("Failed to delete orphaned file:", err));
        }
        res.status(500).send("Server error occurred while updating the CTA section.");
    }
});
router.post("/home/counters", adminController.isAuthenticated, async (req, res) => {
  console.log("Counters POST body:", req.body); // ✅ debug

  try {
    const counters = req.body.counters || [];
    const conn = await db.getConnection();
    await conn.beginTransaction();

    // Loop through array and update rows by index (1 → 4)
    for (let i = 0; i < counters.length; i++) {
      const label = counters[i].label?.trim();
      const value = parseInt(counters[i].value, 10);

      if (label && !isNaN(value)) {
        await conn.query(
          "UPDATE counters SET label = ?, `value` = ? WHERE id = ?",
          [label, value, i + 1] // map array index to DB ID
        );
      }
    }

    await conn.commit();
    conn.release();
    res.redirect("/admin/home");
  } catch (err) {
    console.error("❌ Failed to update counters:", err);
    res.status(500).send("Error updating statistics.");
  }
});





// --- Update Gallery Content ---
router.post("/home/gallery/update", adminController.isAuthenticated, async (req, res) => {
  try {
    const { gallery_heading, gallery_description } = req.body;

    await db.query(
      "UPDATE gallery_content SET heading = ?, description = ? WHERE id = 1",
      [gallery_heading, gallery_description]
    );

    res.redirect("/admin/home");
  } catch (err) {
    console.error("❌ Failed to update gallery content:", err);
    res.status(500).send("Error updating gallery content.");
  }
});


// GET route to display testimonials
router.get('/home/testimonials', adminController.isAuthenticated, async (req, res) => {
    try {
        const [testimonialsContent] = await db.query('SELECT * FROM testimonial_content WHERE id = 1');
        const [testimonials] = await db.query('SELECT * FROM testimonials ORDER BY id');
        
        // Ensure success message is retrieved from a session or query parameter if coming from a redirect
        const successMessage = req.session.successMessage || null;
        const errorMessage = req.session.errorMessage || null;

        // Clear the messages from the session
        delete req.session.successMessage;
        delete req.session.errorMessage;

        res.redirect("/admin/home");
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).send('Server Error');
    }
});

// POST route to update the main testimonial heading and description
router.post('/home/testimonials/update-text', adminController.isAuthenticated, async (req, res) => {
    const { testimonials_heading, testimonials_description } = req.body;
    try {
        await db.query('UPDATE testimonial_content SET heading = ?, description = ? WHERE id = 1', [testimonials_heading, testimonials_description]);
        req.session.successMessage = "Testimonial section text updated successfully!";
        res.redirect('/admin/home/testimonials');
    } catch (err) {
        console.error('Error updating testimonial text:', err);
        req.session.errorMessage = "Failed to update testimonial section text.";
        res.redirect('/admin/home/testimonials');
    }
});

// --- Add new testimonial ---
router.post("/home/testimonials/add", adminController.isAuthenticated, upload.single("testimonial_image"), async (req, res) => {
  const { name, role, description } = req.body;
  const image_path = req.file ? `/images/testimonial/${req.file.filename}` : null;

  if (!image_path) {
    req.session.errorMessage = "Image upload is required.";
    return res.redirect("/admin/home/testimonials");
  }

  try {
    await db.query("INSERT INTO testimonials (name, role, description, image_path) VALUES (?, ?, ?, ?)", [name, role, description, image_path]);
    req.session.successMessage = "New testimonial added successfully!";
    res.redirect("/admin/home/testimonials");
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "Failed to add new testimonial.";
    res.redirect("/admin/home/testimonials");
  }
});


// POST route to delete a testimonial card
router.post('/home/testimonials/delete/:id', adminController.isAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query('SELECT image_path FROM testimonials WHERE id = ?', [id]);
        const testimonial = rows[0];

        if (testimonial && testimonial.image_path) {
            const imagePath = path.join(__dirname, '../../public', testimonial.image_path);
            
            try {
                await fs.promises.access(imagePath);
                await fs.promises.unlink(imagePath);
            } catch (fsErr) {
                if (fsErr.code === 'ENOENT') {
                    console.warn(`File not found, but continuing with database deletion: ${imagePath}`);
                } else {
                    throw fsErr;
                }
            }
        }

        await db.query('DELETE FROM testimonials WHERE id = ?', [id]);
        req.session.successMessage = "Testimonial deleted successfully!";
        res.redirect('/admin/home/testimonials');
    } catch (err) {
        console.error('Error deleting testimonial:', err);
        req.session.errorMessage = "Failed to delete testimonial.";
        res.redirect('/admin/home/testimonials');
    }
});

// POST route to edit an existing testimonial card
// --- Update testimonial ---
router.post('/home/testimonials/edit/:id', adminController.isAuthenticated, upload.single('testimonial_image'), async (req, res) => {
    const { id } = req.params;
    const { name, role, description } = req.body;
    let image_path;

    try {
        // If new image uploaded, use it, else keep old
        if (req.file) {
            image_path = `/images/testimonial/${req.file.filename}`;
            // Optional: delete old image from /public/images/testimonial
            const [oldData] = await db.query('SELECT image_path FROM testimonials WHERE id = ?', [id]);
            if (oldData.length && oldData[0].image_path) {
                const fs = require('fs');
                const oldImagePath = __dirname + '/../public' + oldData[0].image_path;
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.log('Old image not found:', err.message);
                });
            }
        } else {
            const [oldData] = await db.query('SELECT image_path FROM testimonials WHERE id = ?', [id]);
            image_path = oldData.length ? oldData[0].image_path : null;
        }

        await db.query('UPDATE testimonials SET name = ?, role = ?, description = ?, image_path = ? WHERE id = ?', [name, role, description, image_path, id]);
        req.session.successMessage = 'Testimonial updated successfully!';
        res.redirect('/admin/home/testimonials');
    } catch (err) {
        console.error('Error updating testimonial:', err);
        req.session.errorMessage = 'Failed to update testimonial.';
        res.redirect('/admin/home/testimonials');
    }
});

// Change credentials (protected)
// GET change credentials page
router.get("/change-credentials", adminController.isAuthenticated, async (req, res) => {
    try {
        const adminId = req.session.admin.id;
        const [rows] = await db.query("SELECT username FROM admins WHERE id = ?", [adminId]);
        const currentUsername = rows[0]?.username || "";
        res.render("admin/change-credentials", {
            username: currentUsername,
            error: null,
            success: null
        });
    } catch (err) {
        console.error("Error loading change credentials page:", err);
        res.render("admin/change-credentials", {
            username: req.session.admin.username,
            error: "Failed to load admin details",
            success: null
        });
    }
});

// POST change credentials
router.post("/change-credentials", adminController.isAuthenticated, async (req, res) => {
    const { newUsername, currentPassword, newPassword, confirmNewPassword } = req.body;
    const adminId = req.session.admin.id;

    try {
        if (!req.session.admin || !adminId) {
            return res.status(401).render("admin/change-credentials", {
                username: null,
                error: "Unauthorized access. Please log in again.",
                success: null
            });
        }

        // 1. Verify the current password
        const [rows] = await db.query("SELECT password FROM admins WHERE id = ?", [adminId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).render("admin/change-credentials", {
                username: req.session.admin.username,
                error: "User not found.",
                success: null
            });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).render("admin/change-credentials", {
                username: req.session.admin.username,
                error: "Current password is incorrect.",
                success: null
            });
        }

        // 2. Check if new passwords match
        if (newPassword !== confirmNewPassword) {
            return res.status(400).render("admin/change-credentials", {
                username: req.session.admin.username,
                error: "New passwords do not match.",
                success: null
            });
        }

        // 3. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update the database
        await db.query(
            "UPDATE admins SET username = ?, password = ? WHERE id = ?",
            [newUsername, hashedPassword, adminId]
        );

        // 5. Update the session with the new username
        req.session.admin.username = newUsername;

        return res.status(200).render("admin/change-credentials", {
            username: newUsername,
            success: "Credentials updated successfully!",
            error: null
        });

    } catch (err) {
        console.error("Error updating credentials:", err);
        return res.status(500).render("admin/change-credentials", {
            username: req.session.admin ? req.session.admin.username : null,
            error: "Server error. Please try again.",
            success: null
        });
    }
});
// =========================
// 📌 UPLOAD Gallery Images
// =========================
router.post("/home/gallery/upload", upload.array("gallery_images", 10), async (req, res) => {
  try {
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        // Save relative path for frontend use
        const filePath = "/uploads/gallery/" + file.filename;
        await db.query("INSERT INTO gallery_images (file_path) VALUES (?)", [filePath]);
      }
    }
    res.redirect("/admin/home");
  } catch (err) {
    console.error("Error uploading gallery images:", err);
    res.status(500).send("Error uploading gallery images");
  }
});

// =========================
// 📌 DELETE Gallery Image
// =========================
router.get("/home/gallery/delete-image/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // 1. Get file path from DB
    const [rows] = await db.query("SELECT file_path FROM gallery_images WHERE id = ?", [id]);
    if (rows.length > 0) {
      const dbPath = rows[0].file_path; // e.g. "/uploads/gallery/xyz.png"

      // 2. Resolve absolute path
      const absolutePath = path.join(__dirname, "../../public", dbPath);

      // 3. Delete from filesystem
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }

      // 4. Delete DB entry
      await db.query("DELETE FROM gallery_images WHERE id = ?", [id]);
    }

    res.redirect("/admin/home");
  } catch (err) {
    console.error("Error deleting gallery image:", err);
    res.status(500).send("Error deleting gallery image");
  }
});

// GET route: show admin form
// GET route: show admin form
// router.get('/home/why-choose-us', adminController.isAuthenticated, async (req, res) => {
//     try {
//         const [rows] = await db.query('SELECT * FROM why_choose_us WHERE id = 1');
//         const whyChooseUs = rows[0] || {};
//         res.render('admin/why_choose_us', { whyChooseUs });  // make sure this EJS exists
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server Error');
//     }
// });



// POST route: update text and images
router.post('/home/why-choose-us/update', adminController.isAuthenticated, 
    upload.fields([
        { name: 'image_1', maxCount: 1 },
        { name: 'image_2', maxCount: 1 },
        { name: 'image_3', maxCount: 1 }
    ]), 
    async (req, res) => {
  try {
    const {
      main_heading,
      heading_2,
      main_description,
      sub_heading_1,
      description_1,
      sub_heading_2,
      description_2,
      sub_heading_3,
      description_3,
      sub_heading_4,
      description_4
    } = req.body;

    // Build image paths dynamically
    const images = {};
    if (req.files['image_1']) images.image_1 = '/images/' + req.files['image_1'][0].filename;
    if (req.files['image_2']) images.image_2 = '/images/' + req.files['image_2'][0].filename;
    if (req.files['image_3']) images.image_3 = '/images/' + req.files['image_3'][0].filename;

    // Update query
    let query = `UPDATE why_choose_us SET 
      main_heading=?, heading_2=?, main_description=?,
      sub_heading_1=?, description_1=?,
      sub_heading_2=?, description_2=?,
      sub_heading_3=?, description_3=?,
      sub_heading_4=?, description_4=?`;

    const params = [
      main_heading, heading_2, main_description,
      sub_heading_1, description_1,
      sub_heading_2, description_2,
      sub_heading_3, description_3,
      sub_heading_4, description_4
    ];

    // Append images if uploaded
    for (const key in images) {
      query += `, ${key}=?`;
      params.push(images[key]);
    }

    query += ' WHERE id=1';
    await db.query(query, params);

    req.session.successMessage = 'Section updated successfully!';
    res.redirect('/admin/home');
  } catch (err) {
    console.error(err);
    req.session.errorMessage = 'Failed to update section.';
    res.redirect('/admin/home');
  }
});


module.exports = router;