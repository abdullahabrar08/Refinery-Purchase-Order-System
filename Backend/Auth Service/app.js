const express = require("express");
const configureAPI = require("./api");

const app = express();

configureAPI(app);

module.exports = app;
