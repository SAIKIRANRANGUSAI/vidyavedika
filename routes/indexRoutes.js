const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    // --- Home content ---
    const [homeRows] = await db.query("SELECT * FROM home_page_content WHERE id = 1");
    let homeContent = homeRows[0] || {};

    if (homeContent.banner_image_paths) {
      if (typeof homeContent.banner_image_paths === "string") {
        try {
          homeContent.banner_image_paths = JSON.parse(homeContent.banner_image_paths);
        } catch (err) {
          console.error("JSON parse error:", err);
          homeContent.banner_image_paths = [];
        }
      }
    } else {
      homeContent.banner_image_paths = [];
    }

    // ✅ Fetch gallery images (all)
    const [galleryImages] = await db.query("SELECT * FROM gallery_images");

    // 👉 Pagination logic
    const perPage = 8;
    const page = parseInt(req.query.page) || 1;
    const totalPages = Math.ceil(galleryImages.length / perPage);

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const imagesToShow = galleryImages.slice(start, end);



    // --- CTA content ---
    const [ctaRows] = await db.query("SELECT * FROM cta_content WHERE id = 1");
    let ctaContent = ctaRows[0] || {
      cta_heading: "Default heading",
      cta_text: "Default text",
      cta_image_path: "/images/default.png",
    };

    console.log("👉 CTA Content from DB:", ctaContent);

   // --- Gallery content (heading + desc) ---
    const [galleryRows] = await db.query("SELECT * FROM gallery_content WHERE id = 1");
    let galleryContent = galleryRows[0] || {
      heading: "Default Gallery Heading",
      description: "Default gallery description.",
    };
    const [whyChooseRows] = await db.query('SELECT * FROM why_choose_us WHERE id = 1');
    const whyChooseUs = whyChooseRows[0] || {};


    // --- Testimonials content ---
    const [testimonialRows] = await db.query("SELECT * FROM testimonial_content WHERE id = 1");
    let testimonialContent = testimonialRows[0] || {
      heading: "Our Happy Customers",
      description: "Join thousands of happy patients who trust us for gentle, expert care and beautiful smiles. Your perfect dental experience starts here!"
    };

    const [testimonials] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");



    // --- Counters content ---
    const [counterRows] = await db.query("SELECT * FROM counters");
    let counters = counterRows || [];

    const [sections] = await db.query("SELECT * FROM course_section ORDER BY id ASC");
    const [courses] = await db.query("SELECT * FROM courses ORDER BY id ASC");

    // const [galleryRows] = await db.query("SELECT * FROM gallery_content WHERE id = 1");
    const [aboutRows] = await db.query("SELECT * FROM about_us WHERE id = 1");
    let aboutUs = aboutRows[0] || {
      heading: "Default About Us Heading",
      paragraph1: "Default paragraph 1 about our school.",
      paragraph2: "Default paragraph 2 about our school.",
      image1: "/images/default1.png",
      image2: "/images/default2.png",
    };

    // let galleryContent = galleryRows[0] || {
    //   heading: "Default Gallery Heading",
    //   description: "Default gallery description.",
    // };


    console.log("👉 CTA Content from DB:", ctaContent);
    console.log("👉 Counters from DB:", counters);

    // --- Pass both into EJS ---
    res.render("index", { homeContent, ctaContent, counters, galleryContent,
      galleryImages,
      imagesToShow,   // ✅ current page images
      currentPage: page,  // ✅ add currentPage
      totalPages,         // ✅ add totalPages,
      imagesToShow, testimonialContent, testimonials, whyChooseUs, sections, courses, aboutUs });

  } catch (err) {
    console.error("Error in homepage route:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
