const express = require('express');
const router = express.Router();
const db = require('../../config/db'); // adjust path to your db module
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const adminController = require("../controllers/adminController");
// configure Cloudinary (ensure env vars set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: path.join(__dirname, '../../tmp') });
router.use(adminController.isAuthenticated);
// List all
router.get('/seo', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM seo_meta ORDER BY page_key ASC');
    res.render('admin_seo', { seoList: rows, editing: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// New (reuse form) - optional
router.get('/seo/new', (req, res) => {
  res.render('admin_seo', { seoList: [], editing: false });
});

// Edit
router.get('/seo/edit/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM seo_meta WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) return res.redirect('/admin/seo');
    const seo = rows[0];
    const [all] = await db.query('SELECT * FROM seo_meta ORDER BY page_key ASC');
    res.render('admin_seo', { seoList: all, editing: true, seo });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Save (create or update) - handles og_image_file upload
router.post('/seo/save', upload.single('og_image_file'), async (req, res) => {
  try {
    const body = req.body;
    let ogImage = body.og_image_url || null;

    if (req.file) {
      // upload to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'vidyavedika/seo'
      });
      ogImage = result.secure_url;
      // delete tmp file
      fs.unlink(req.file.path, () => {});
    }

    const data = [
      body.page_key,
      body.title || null,
      body.meta_description || null,
      body.meta_keywords || null,
      body.og_title || null,
      body.og_description || null,
      ogImage,
      body.canonical || null,
      body.robots || 'index,follow',
      body.schema_json || null
    ];

    if (body.id) {
      // update
      await db.query(
        `UPDATE seo_meta SET page_key=?, title=?, meta_description=?, meta_keywords=?, og_title=?, og_description=?, og_image=?, canonical=?, robots=?, schema_json=? WHERE id=?`,
        [...data, body.id]
      );
    } else {
      // insert (ignore duplicate page_key)
      await db.query(
        `INSERT INTO seo_meta (page_key, title, meta_description, meta_keywords, og_title, og_description, og_image, canonical, robots, schema_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        data
      );
    }

    res.redirect('/admin/seo');
  } catch (err) {
    console.error('save seo error', err);
    res.status(500).send('Server error');
  }
});

// Delete
router.post('/seo/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM seo_meta WHERE id = ?', [req.params.id]);
    res.redirect('/admin/seo');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
