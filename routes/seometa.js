const express = require('express');
const router = express.Router();
const db = require('../config/db'); // adjust path if needed

// Helper: match wildcard page_key like '/courses/*'
function wildcardToRegex(key) {
  // '/courses/*' => ^/courses/.*$
  const esc = key.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const reg = '^' + esc.replace(/\\\*/g, '.*') + '$';
  return new RegExp(reg);
}

// Replace template placeholders like {{title}} using vars map
function renderTemplate(str, vars = {}) {
  if (!str) return str;
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    return (vars[name] !== undefined && vars[name] !== null) ? vars[name] : '';
  });
}

async function findSeoForPath(path) {
  // 1) exact match
  const [exactRows] = await db.query('SELECT * FROM seo_meta WHERE page_key = ?', [path]);
  if (exactRows && exactRows.length) return exactRows[0];

  // 2) pattern matches (rows containing '*')
  const [patternRows] = await db.query("SELECT * FROM seo_meta WHERE page_key LIKE '%*%'");
  for (const row of patternRows) {
    const re = wildcardToRegex(row.page_key);
    if (re.test(path)) return row;
  }

  // 3) fallback to 'default' or '/'
  const [defRows] = await db.query('SELECT * FROM seo_meta WHERE page_key IN (?, ?)', ['default', '/']);
  if (defRows && defRows.length) return defRows[0];

  return null;
}

async function seoMiddleware(req, res, next) {
  try {
    const path = req.path; // e.g. /courses/iit-jee
    const seoRow = await findSeoForPath(path);

    // Put full absolute URL to use in templates
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.locals.fullUrl = fullUrl;

    if (!seoRow) {
      res.locals.seo = null;
      return next();
    }

    // Map DB fields to res.locals.seo
    res.locals.seo = {
      id: seoRow.id,
      page_key: seoRow.page_key,
      title: seoRow.title,
      meta_description: seoRow.meta_description,
      meta_keywords: seoRow.meta_keywords,
      og_title: seoRow.og_title,
      og_description: seoRow.og_description,
      og_image: seoRow.og_image,
      canonical: seoRow.canonical || fullUrl,
      robots: seoRow.robots,
      schema_json: seoRow.schema_json
    };

    // NOTE: We don't substitute placeholders here because some dynamic pages (course view)
    // need data from their own DB fetch. For those pages, you will merge/override in route handlers.
    next();
  } catch (err) {
    console.error('SEO middleware error:', err);
    next();
  }
}

module.exports = {
  seoMiddleware,
  renderTemplate,
  findSeoForPath
};
