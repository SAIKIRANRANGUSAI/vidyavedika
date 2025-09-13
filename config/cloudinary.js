// import { v2 as cloudinary } from "cloudinary";
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dhuzvzyut",
  api_key: "137541939741886",
  api_secret: "md1qaE-t6Zrck4vD18N-vlQtT6M",
});

// export default cloudinary;
module.exports = cloudinary;

