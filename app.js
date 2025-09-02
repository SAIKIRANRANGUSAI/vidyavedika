require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/db");
const app = express();
const DEFAULT_IMAGE = "/images/default.png";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require("express-session");
const adminRoutes = require("./admin/routes/adminRoutes");

// Session setup
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true
}));

// Mount admin routes
app.use("/admin", adminRoutes);

// Serve admin static files
app.use("/admin/static", express.static(path.join(__dirname, "admin/public")));

app.get("/admin/test", (req, res) => {
    res.send("Admin test route works!");
});


// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


// Static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));

// Example route
app.get("/", (req, res) => {
  res.render("index"); 
});
app.get("/about", (req, res) => res.render("about"));
app.get("/student-life", (req, res) => res.render("student-life"));
app.get("/gallery", (req, res) => res.render("gallery"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/academics", (req, res) => res.render("academics"));

//app.get("/courses", (req, res) => res.render("courses"));
// List all courses

// 📌 GET all courses (courses page)
app.get("/courses", async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.id, c.name, c.slug, c.short_desc,
              IFNULL(i.file_path, ?) AS icon
       FROM courses c
       LEFT JOIN other_images i ON c.icon_image_id = i.id`,
      [DEFAULT_IMAGE]
    );
    res.render("courses", { courses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching courses");
  }
});
// Single course by slug
app.get("/courses/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch selected course
    const [courseRows] = await db.query(
      `SELECT c.id, c.name, c.slug, c.short_desc, c.full_content,
              IFNULL(b.file_path, ?) AS banner
       FROM courses c
       LEFT JOIN other_images b ON c.banner_image_id = b.id
       WHERE c.slug = ?`,
      [DEFAULT_IMAGE, slug]
    );

    if (courseRows.length === 0) {
      return res.status(404).send("Course not found");
    }

    const course = courseRows[0];

    // Fetch related courses
    const [related] = await db.query(
      `SELECT c.id, c.name, c.slug, c.short_desc,
              IFNULL(i.file_path, ?) AS icon
       FROM courses c
       LEFT JOIN other_images i ON c.icon_image_id = i.id
       WHERE c.slug != ?
       LIMIT 6`,
      [DEFAULT_IMAGE, slug]
    );

    res.render("course-view", { course, related });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching course details");
  }
});






// DB test route
app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) {
      console.error("❌ Query error:", err);
      return res.status(500).send("Database test failed");
    }
    res.send(`✅ Database Connected! Result: ${results[0].result}`);
  });
});

// Use PORT from .env or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

