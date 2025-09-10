const serverless = require('serverless-http');
const app = require('../app'); // import your existing app
module.exports = app;
module.exports.handler = serverless(app);
