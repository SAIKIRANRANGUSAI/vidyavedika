// scripts/seedImages.js
const fs = require("fs");
const path = require("path");
const db = require("../config/db"); // adjust if needed

// Config for each folder and DB table
const folders = [
  {
    dir: path.join(__dirname, "../public/images/icons"),
    table: "icons",
    category: null, // not needed
  },
  {
    dir: path.join(__dirname, "../public/images/testimonial"),
    table: "testimonial_images",
    category: null,
  },
  {
    dir: path.join(__dirname, "../public/images/ui"),
    table: "ui_images",
    category: null,
  },
  // NEW (correct)
{
dir: path.join(__dirname, "../public/images"), // directly inside /images
table: "other_images",
category: "general", // or null if you don’t want category
},

  
];

// Helper: insert file into DB
function insertFile(table, filePath, fileName, altText, category = null) {
  let sql;
  let values;

  if (table === "other_images") {
    sql =
      "INSERT INTO other_images (name, file_path, category, alt_text) VALUES (?, ?, ?, ?)";
    values = [fileName, filePath, category, altText];
  } else {
    sql = `INSERT INTO ${table} (name, file_path, alt_text) VALUES (?, ?, ?)`;
    values = [fileName, filePath, altText];
  }

  db.query(sql, values, (err) => {
    if (err) {
      console.error(`❌ Failed to insert ${fileName} into ${table}:`, err.message);
    } else {
      console.log(`✅ Inserted ${fileName} into ${table}`);
    }
  });
}

// Loop through folders
folders.forEach(({ dir, table, category }) => {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Skipped: folder not found -> ${dir}`);
    return;
  }

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`❌ Error reading folder ${dir}:`, err);
      return;
    }

    files.forEach((file) => {
      const relPath = path
        .relative(path.join(__dirname, "../public"), path.join(dir, file))
        .replace(/\\/g, "/"); // normalize for Windows

      const altText = file.split(".")[0]; // use filename as alt
      insertFile(table, relPath, file, altText, category);
    });
  });
});
