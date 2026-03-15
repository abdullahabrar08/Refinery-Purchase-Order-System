const axios = require("axios");
const { services} = require("../config/index");
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const instance = axios.create({
  baseURL: services.notifications,
  // `timeout` specifies the number of milliseconds before the request times out.
  // If the request takes longer than `timeout`, the request will be aborted.
  headers: {
    "Content-Type": "application/json",
  },
  httpsAgent: agent,
});

module.exports = instance;
