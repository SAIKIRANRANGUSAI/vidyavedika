const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController"); // make sure path is correct

// Login page (GET)
router.get("/login", adminController.getLogin);

// Login form (POST)
router.post("/login", adminController.postLogin);

// Dashboard (protected)
router.get("/dashboard", adminController.isAuthenticated, adminController.getDashboard);

module.exports = router;
