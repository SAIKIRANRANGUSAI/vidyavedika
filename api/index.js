const serverless = require("serverless-http");
const app = require("../app"); // point to your main Express app

module.exports = app;
module.exports.handler = serverless(app);
