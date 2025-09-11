const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Gallery Page Route
router.get("/gallery", async (req, res) => {
  try {
    // Fetch gallery images from DB
    const [galleryImages] = await db.query("SELECT * FROM gallery_images");

    // Optional: Fetch gallery heading/description if you have gallery_content table
    const [galleryRows] = await db.query("SELECT * FROM gallery_content WHERE id = 1");
    const galleryContent = galleryRows[0] || {
      heading: "Gallery",
      description: "No description available",
    };

    // ✅ Pass variables to EJS
    res.render("gallery", { galleryContent, galleryImages });
  } catch (err) {
    console.error("Error loading gallery page:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
