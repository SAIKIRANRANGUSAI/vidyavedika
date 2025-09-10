require("dotenv").config();
const express = require("express");

//const path = require("path");
const db = require("./config/db");
const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.use(express.static("public"));

// Add both main views and admin views
app.set("views", [
    path.join(__dirname, "views"),
    path.join(__dirname, "admin", "views")
]);

// Middleware to load footer data for all pages
app.use(async function (req, res, next) {
  try {
    // Fetch contact details
    const [contactRows] = await db.query(
      "SELECT * FROM contact_details ORDER BY id DESC LIMIT 1"
    );
    const contactData = contactRows[0] || null;

    // Fetch social links
    const [socialRows] = await db.query(
      "SELECT * FROM admin_social ORDER BY id DESC LIMIT 1"
    );
    const socialData = socialRows[0] || null;

    // Fetch current logo
    const [logoRows] = await db.query(
      "SELECT logo FROM settings ORDER BY id DESC LIMIT 1"
    );
    const logo = logoRows.length ? logoRows[0].logo : "/admin/static/images/logo.png";

    // Attach to res.locals so EJS can access it in any view
    res.locals.footerData = {
      contact: contactData,
      social: socialData,
    };
    res.locals.logo = logo; // make logo available globally

    next();
  } catch (err) {
    console.error("Footer data error:", err);
    res.locals.footerData = { contact: null, social: null };
    res.locals.logo = "/admin/static/images/logo.png";
    next();
  }
});



app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const DEFAULT_IMAGE = "/images/default.png";
const bcrypt = require("bcryptjs");
const session = require("express-session");

app.use(
  session({
    secret: "sai123456", // change to a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set secure: true if using https
  })
);

const aboutusRoutes = require("./routes/aboutusRoutes"); 
app.use("/", aboutusRoutes);

const adminRoutes = require("./admin/routes/adminRoutes");
const indexRoutes = require('./routes/indexRoutes');
app.use('/', indexRoutes); 
const galleryRoutes = require("./routes/galleryRoutes");
app.use("/", galleryRoutes);
const adminAboutRoutes = require("./admin/routes/adminaboutRoutes"); 




app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
// Top of app.js
const adminAcademicsRoutes = require("./admin/routes/adminacademics");
app.use("/admin/academics", adminAcademicsRoutes);



// const adminCourseRoutes = require("./admin/routes/admincourse");
const adminStudentLifeRoutes = require("./admin/routes/adminstudent-life");
app.use("/admin/student-life", adminStudentLifeRoutes);

const adminContactUsRouter = require('./admin/routes/admincontactus');
app.use('/admin/contactus', adminContactUsRouter);

// Middleware
// Middleware to parse URL-encoded bodies from HTML forms
// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// Session setup
// app.use(session({
//     secret: process.env.SESSION_SECRET || "your_secret_key",
//     resave: false,
//     saveUninitialized: true
// }));
const websiteContactRoutes = require("./routes/websiteContact");
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.json());
app.use("/", websiteContactRoutes);



// Serve static files
// 1. Admin panel assets (CSS/JS/images specific to admin)
// Public images and assets
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public'))); // serves /images, /css, etc


//app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Admin panel assets
app.use("/admin/static", express.static(path.join(__dirname, "admin/public")));



// Set EJS as template engine
app.set("view engine", "ejs");

// ✅ Allow both frontend views and admin views


// -------------------- LOGIN ROUTES -------------------- //
// Dynamic Admin Login Page
app.get("/admin/login", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT logo FROM settings WHERE id=1");
        const logo = rows.length ? rows[0].logo : "/admin/static/images/logo.png";
        res.render("login", { logo, error: null });   // ✅ just "login"
    } catch (err) {
        console.error("❌ Error fetching logo:", err);
        res.render("login", { logo: "/admin/static/images/logo.png", error: null });
    }
});


// Admin About Us routes
app.use("/admin", adminAboutRoutes); 

// Handle Login POST
app.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
        if (rows.length === 0)
            return res.render("login", { logo: "/admin/static/images/logo.png", error: "Invalid username or password" });

        const match = await bcrypt.compare(password, rows[0].password);
        if (!match)
            return res.render("login", { logo: "/admin/static/images/logo.png", error: "Invalid username or password" });

        req.session.admin = { id: rows[0].id, username: rows[0].username };
        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("❌ Login error:", err);
        res.render("login", { logo: "/admin/static/images/logo.png", error: "Something went wrong" });
    }
});


// Admin routes







// Logout route
app.get("/admin/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
});
// ----------------------------------------------------------- //
// const footerRoute = require("./routes/footerRoute");
// app.use("/", footerRoute);

// Mount admin routes
app.use("/admin", adminRoutes);

// -------------------- PUBLIC ROUTES -------------------- //
app.get("/", (req, res) => res.render("index"));
app.get("/about", (req, res) => res.render("about"));
//app.get("/student-life", (req, res) => res.render("student-life"));
app.get("/gallery", (req, res) => res.render("gallery"));
app.get("/contact", (req, res) => res.render("contact"));
//app.get("/academics", (req, res) => res.render("academics"));
const academicsRoutes = require("./routes/academicsRoutes");
app.use("/", academicsRoutes);

// -------------------- COURSE ROUTES -------------------- //
const courseRoutes = require("./routes/courseRoutes");
app.use("/courses", courseRoutes);


const adminCourseRoutes = require("./admin/routes/admincourse");
app.use("/admin/course", adminCourseRoutes);   // singular



app.get("/test-db", async (req, res) => {
    try {
        const [results] = await db.query("SELECT 1 + 1 AS result");
        res.send(`✅ Database Connected! Result: ${results[0].result}`);
    } catch (err) {
        console.error("❌ Query error:", err);
        res.status(500).send("Database test failed");
    }
});
//app.use(express.static(path.join(__dirname, 'public')));
app.get('/test-image', (req, res) => {
    res.send('<img src="/images/1756986237536-160805489.png">');
});

const studentLifeRoutes = require("./routes/student-lifeRoutes");
app.use("/student-life", studentLifeRoutes);

app.get('/course-view', (req, res) => {
  res.render('course-view');
});


// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
module.exports = app;