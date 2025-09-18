const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs"); // Use promises version of fs
// Multer memory storage (no disk writes)
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary = require("../../config/cloudinary");

const adminController = require('../controllers/adminController');

const db = require("../../config/db");
const contactUsRoute = require("./admincontactus");
//const { isAuthenticated } = adminController;
// Place this at the very top of adminRoutes.js

router.get("/login", adminController.getLogin);

// Login form (POST)
router.post("/login", adminController.postLogin);

router.use(adminController.isAuthenticated);

// Configure Multer for file uploads

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../../public/images')); // save to public/images
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     cb(null, uniqueSuffix + ext); // unique filename
//   }
// });

// const upload = multer({ storage });

// router.use(async (req, res, next) => {
//   try {
//     const [rows] = await db.query("SELECT logo FROM settings LIMIT 1");
//     res.locals.logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
//   } catch (err) {
//     console.error("Error fetching logo:", err);
//     res.locals.logo = "/admin/static/images/logo.png";
//   }
//   next();
// });

// Use logo middleware for all admin routes
// router.use(adminController.getAdminLogo);
router.post("/dashboard/update-logo", upload.single("logo"), async (req, res) => {
  try {
    // if (!req.file) {
    //   req.session.logoError = "Please select a file";
    //   return res.redirect("/admin/dashboard");
    // }

    // Remove old logo if exists and not default
    if (res.locals.logo && !res.locals.logo.includes("default")) {
      const oldPath = path.join(__dirname, "/images/", res.locals.logo.replace("/", ""));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Upload new logo to Cloudinary
const result = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: "vidyavedika/logo" },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  );
  stream.end(req.file.buffer);
});

// Only save secure_url in `logo` column
await db.query("UPDATE settings SET logo=? WHERE id=2", [result.secure_url]);

    // req.session.logoSuccess = "Logo updated successfully!";
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    //req.session.logoError = "Error updating logo";
    res.redirect("/admin/dashboard");
  }
});

// Login page (GET)


// Dashboard (protected)
//router.get("/dashboard", adminController.isAuthenticated, adminController.getDashboard);
router.use("/contact-us", contactUsRoute);
// router.post("/contact-us/save", isAuthenticated, async (req, res) => {
//     try {
//         const { heading, description } = req.body;

//         const [rows] = await db.query("SELECT id FROM get_in_touch LIMIT 1");

//         if (rows.length > 0) {
//             await db.query("UPDATE get_in_touch SET heading = ?, description = ? WHERE id = ?", 
//                 [heading, description, rows[0].id]);
//         } else {
//             await db.query("INSERT INTO get_in_touch (heading, description) VALUES (?, ?)", 
//                 [heading, description]);
//         }

//         res.redirect("/admin/dashboard"); // ✅ Redirect, do not render
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Database error");
//     }
// });
// --- Home editor (GET) ---
// --- Home editor (GET) ---
router.get("/home", async (req, res) => {
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
      "SELECT id, main_heading, main_description, created_at, updated_at FROM course_section"
    );
    const [socialRows] = await db.query("SELECT * FROM admin_social WHERE id = 1");
    const socialData = socialRows[0] || {
      description: "",
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      whatsapp: ""
    };


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
      testimonials: testimonialsData,
      social: socialData,
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
router.post("/home/hero", upload.array("banner_images"), async (req, res) => {
  const { heading, sub_heading, description } = req.body;
  const newFiles = req.files || [];

  try {
    // 1. Get the current image paths from the database
    // This is the correct way to handle data from a JSON column
    const [homeContentRows] = await db.query("SELECT banner_image_paths FROM home_page_content WHERE id = 1");
    const currentPaths = (homeContentRows[0] && homeContentRows[0].banner_image_paths) || [];

// 2. Upload new files to Cloudinary and collect URLs
const newPaths = [];
for (let file of newFiles) {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "vidyavedika/hero" }, // Cloudinary folder
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  newPaths.push(result.secure_url); // store full Cloudinary URL
}

// 3. Combine the old and new image URLs
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


router.get("/home/hero/delete-image", async (req, res) => {
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
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log("Image deleted successfully");
      }
    });

    // 5. Redirect back to the home page
    res.redirect("/admin/home");
  } catch (err) {
    console.error("Image delete error:", err);
    res.status(500).send("Server error occurred while deleting the image.");
  }
});

// --- CTA update (POST) ---
router.post("/home/cta", upload.single("cta_image"), async (req, res) => {
  const { cta_heading, cta_text } = req.body;
  const newFile = req.file;
  let newImagePath = null;

  try {
    // 1. Get the current CTA image path from the database
    const [ctaContentRows] = await db.query("SELECT cta_image_path FROM cta_content WHERE id = 1");
    const currentImagePath = ctaContentRows[0]?.cta_image_path;

    if (newFile) {
  // 1. Upload new file to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "vidyavedika/cta" }, // Cloudinary folder
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(newFile.buffer);
  });

  newImagePath = result.secure_url; // Cloudinary URL

  // 2. Delete old image from Cloudinary (if exists)
  if (currentImagePath) {
    // Extract public_id from old URL
    const publicId = currentImagePath
      .split("/")
      .slice(-2) // take folder + filename
      .join("/")
      .split(".")[0]; // remove file extension

    try {
      await cloudinary.uploader.destroy(publicId);
      console.log("Old CTA image deleted from Cloudinary:", publicId);
    } catch (err) {
      console.error("Failed to delete old CTA image:", err);
    }
  }
} else {
  // No new file, keep the old path
  newImagePath = currentImagePath;
}

// 3. Update the database with the new data
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
router.post("/home/counters", async (req, res) => {
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
router.post("/home/gallery/update", async (req, res) => {
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
router.get('/home/testimonials', async (req, res) => {
  try {
    const [testimonialsContent] = await db.query('SELECT * FROM testimonial_content WHERE id = 1');
    const [testimonials] = await db.query('SELECT * FROM testimonials ORDER BY id');

    // Ensure success message is retrieved from a session or query parameter if coming from a redirect
    // const successMessage = req.session.successMessage || null;
    // const errorMessage = req.session.errorMessage || null;

    // // Clear the messages from the session
    // delete req.session.successMessage;
    // delete req.session.errorMessage;

    res.redirect("/admin/home");
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).send('Server Error');
  }
});

// POST route to update the main testimonial heading and description
router.post('/home/testimonials/update-text', async (req, res) => {
  const { testimonials_heading, testimonials_description } = req.body;
  try {
    await db.query('UPDATE testimonial_content SET heading = ?, description = ? WHERE id = 1', [testimonials_heading, testimonials_description]);
    // req.session.successMessage = "Testimonial section text updated successfully!";
    res.redirect('/admin/home/testimonials');
  } catch (err) {
    console.error('Error updating testimonial text:', err);
    // req.session.errorMessage = "Failed to update testimonial section text.";
    res.redirect('/admin/home/testimonials');
  }
});

// --- Add new testimonial ---
router.post("/home/testimonials/add", upload.single("testimonial_image"), async (req, res) => {
  const { name, role, description } = req.body;

  if (!req.file) {
    // req.session.errorMessage = "Image upload is required.";
    return res.redirect("/admin/home/testimonials");
  }

  try {
    // 1. Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "vidyavedika/testimonials" }, // Cloudinary folder
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const image_path = result.secure_url; // Cloudinary URL

    // 2. Insert into database
    await db.query(
      "INSERT INTO testimonials (name, role, description, image_path) VALUES (?, ?, ?, ?)",
      [name, role, description, image_path]
    );

    // req.session.successMessage = "New testimonial added successfully!";
    res.redirect("/admin/home/testimonials");
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "Failed to add new testimonial.";
    res.redirect("/admin/home/testimonials");
  }
});

// POST route to delete a testimonial card
router.post('/home/testimonials/delete/:id', async (req, res) => {
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
    // req.session.successMessage = "Testimonial deleted successfully!";
    res.redirect('/admin/home/testimonials');
  } catch (err) {
    console.error('Error deleting testimonial:', err);
    // req.session.errorMessage = "Failed to delete testimonial.";
    res.redirect('/admin/home/testimonials');
  }
});

// POST route to edit an existing testimonial card
// --- Update testimonial ---
router.post('/home/testimonials/edit/:id', upload.single('testimonial_image'), async (req, res) => {
  const { id } = req.params;
  const { name, role, description } = req.body;
  let image_path;

  try {
    // 1. Get old testimonial data
    const [oldData] = await db.query('SELECT image_path FROM testimonials WHERE id = ?', [id]);
    const oldImagePath = oldData.length ? oldData[0].image_path : null;

    // 2. If new image uploaded
    if (req.file) {
      // Upload new image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'vidyavedika/testimonials' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      image_path = result.secure_url; // Cloudinary URL

      // 3. Delete old image from Cloudinary if exists
      if (oldImagePath) {
        const publicId = oldImagePath
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0]; // folder/filename without extension

        try {
          await cloudinary.uploader.destroy(publicId);
          console.log('Old testimonial image deleted from Cloudinary:', publicId);
        } catch (err) {
          console.error('Failed to delete old testimonial image:', err);
        }
      }
    } else {
      // No new image, keep old path
      image_path = oldImagePath;
    }

    // 4. Update DB
    await db.query(
      'UPDATE testimonials SET name = ?, role = ?, description = ?, image_path = ? WHERE id = ?',
      [name, role, description, image_path, id]
    );

    res.redirect('/admin/home/testimonials');
  } catch (err) {
    console.error('Error updating testimonial:', err);
    res.redirect('/admin/home/testimonials');
  }
});
// Change credentials (protected)
// GET change credentials page
router.get("/change-credentials", async (req, res) => {
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

// GET credentials (optional)
router.get("/change-credentials", adminController.getChangeCredentials);

// POST credentials
router.post("/change-credentials", adminController.postChangeCredentials);

// 📌 UPLOAD Gallery Images
// =========================
// router.post("/home/gallery/upload", upload.array("gallery_images", 10), async (req, res) => {
//   try {
//     if (req.files && req.files.length > 0) {
//       console.log("Files to upload:", req.files.length);
//       for (let file of req.files) {
//         console.log("Uploading file:", file.originalname);
//         // Save relative path for frontend use
//         //const filePath = "/images/" + file.filename;
//         const result = await new Promise((resolve, reject) => {
//           const stream = cloudinary.uploader.upload_stream(
//             { folder: "vidyavedika/gallery" }, // Folder in Cloudinary
//             (error, result) => {
//               if (error) reject(error);
//               else resolve(result);
//             }
//           );
//           stream.end(file.buffer);
//         });
//         const stream = result.secure_url; // Use secure_url for HTTPS
//         console.log("Uploaded to Cloudinary:", stream);
//         //await db.query("INSERT INTO gallery_images (file_path) VALUES (?)", [stream]);
//       }
//     }
//     // req.session.logoError = "";
//     res.redirect("/admin/home");
//   } catch (err) {
//     console.error("Error uploading gallery images:", err);
//     res.status(500).send("Error uploading gallery images");
//   }
// });

router.post("/home/gallery/upload", upload.array("gallery_images", 10), async (req, res) => {
  try {
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        // Upload each file to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "vidyavedika/gallery" }, // Cloudinary folder
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer); // send buffer instead of file path
        });

        // Store the Cloudinary URL in DB
        await db.query("INSERT INTO gallery_images (file_path) VALUES (?)", [result.secure_url]);
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

    // Check if image exists in DB
    const [rows] = await db.query(
      "SELECT file_path FROM gallery_images WHERE id = ?",
      [id]
    );

    if (rows.length > 0) {
      // Optionally, delete local file if stored locally
      // const absolutePath = path.join(__dirname, "../../public", rows[0].file_path);
      // if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

      // Delete DB entry
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
router.post('/home/why-choose-us/update',
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

      // Build image paths dynamically with Cloudinary upload
      const images = {};
      for (const key of ['image_1', 'image_2', 'image_3']) {
        if (req.files[key]) {
          const file = req.files[key][0];
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'vidyavedika/why_choose_us' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });
          images[key] = result.secure_url; // Cloudinary URL
        }
      }

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

      // req.session.successMessage = 'Section updated successfully!';
      res.redirect('/admin/home');
    } catch (err) {
      console.error(err);
      // req.session.errorMessage = 'Failed to update section.';
      res.redirect('/admin/home');
    }
  });

router.post("/update-social", async (req, res) => {
  try {
    const { description, facebook, twitter, instagram, youtube, whatsapp } = req.body;

    await db.query(
      `UPDATE admin_social 
       SET description=?, facebook=?, twitter=?, instagram=?, youtube=?, whatsapp=?, updated_at=NOW()
       WHERE id = 1`,
      [description, facebook, twitter, instagram, youtube, whatsapp]
    );

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("Update social error:", err);
    res.json({ success: false, message: "Failed to update social links" });
  }
});




// --- Middleware: fetch logo for all admin pages ---


// --- Middleware to load logo in all admin views ---
// Middleware to load logo in all admin views
// Must be at the top of adminRoutes.js


// router.post("/dashboard/update-logo", isAuthenticated, upload.single("logo"), async (req, res) => {
//     try {
//         if (!req.file) {
//             req.session.logoError = "Please select a file";
//             return res.redirect("/admin/dashboard");
//         }

//         const logoPath = "/images/" + req.file.filename; // matches public/images
//         await db.query("UPDATE settings SET logo = ? WHERE id = 1", [logoPath]);

//         req.session.logoSuccess = "Logo updated successfully!";
//         res.redirect("/admin/dashboard");
//     } catch (err) {
//         console.error("Error updating logo:", err);
//         req.session.logoError = "Failed to update logo";
//         res.redirect("/admin/dashboard");
//     }
// });



// --- Dashboard page ---
router.get("/dashboard", async (req, res) => {
  try {
    // Existing queries
    const [contactRows] = await db.query("SELECT * FROM get_in_touch LIMIT 1");
    const contactUs = contactRows[0] || {};

    const [detailsRows] = await db.query("SELECT * FROM contact_details LIMIT 1");
    const contactDetails = detailsRows[0] || {};

    const [messages] = await db.query("SELECT * FROM contact_messages ORDER BY created_at DESC");

    // New: fetch social links
    const [socialRows] = await db.query("SELECT * FROM admin_social WHERE id = 1");
    const social = socialRows[0] || {};

    res.render("dashboard", {
      username: req.session.username || "Admin User",
      contactUs,
      contactDetails,
      messages,
      social, // <-- pass social links to dashboard
      // logo is automatically available via middleware
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Server error");
  }
});

// --- Update logo ---
// router.post("/dashboard/update-logo", upload.single("logo"), async (req, res) => {
//   try {
//     if (!req.file) {
//       req.session.logoError = "Please select a file";
//       return res.redirect("/admin/dashboard");
//     }

//     const logoPath = "/images/" + req.file.filename; // matches public/images
//     await db.query("UPDATE settings SET logo = ? WHERE id = 2", [logoPath]);

//     req.session.logoSuccess = "Logo updated successfully!";
//     res.redirect("/admin/dashboard");
//   } catch (err) {
//     console.error("Error updating logo:", err);
//     req.session.logoError = "Failed to update logo";
//     res.redirect("/admin/dashboard");
//   }
// });

// --- Save Contact Us ---
router.post("/contact-us/save", async (req, res) => {
  try {
    const { heading, description } = req.body;

    const [rows] = await db.query("SELECT id FROM get_in_touch LIMIT 1");

    if (rows.length > 0) {
      await db.query(
        "UPDATE get_in_touch SET heading = ?, description = ? WHERE id = ?",
        [heading, description, rows[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO get_in_touch (heading, description) VALUES (?, ?)",
        [heading, description]
      );
    }

    // Redirect to #contact-us section
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error saving Contact Us:", err);
    res.status(500).send("Database error");
  }
});

// --- Save Contact Details ---
router.post("/contactus/contact-details/save", async (req, res) => {
  try {
    let { location_heading, location_text, phone_heading, phone_number, email_heading, email_address } = req.body;

    // ✅ If multiple emails (from array), join them into a string
    if (Array.isArray(email_address)) {
      email_address = email_address.join(",");
    }

    const [rows] = await db.query("SELECT id FROM contact_details LIMIT 1");

    if (rows.length > 0) {
      await db.query(
        `UPDATE contact_details 
                 SET location_heading=?, location_text=?, phone_heading=?, phone_number=?, email_heading=?, email_address=? 
                 WHERE id=?`,
        [location_heading, location_text, phone_heading, phone_number, email_heading, email_address, rows[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO contact_details 
                 (location_heading, location_text, phone_heading, phone_number, email_heading, email_address) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [location_heading, location_text, phone_heading, phone_number, email_heading, email_address]
      );
    }

    // Redirect to #contact-details section
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error saving Contact Details:", err);
    res.status(500).send("Database error");
  }
});



module.exports = router;

