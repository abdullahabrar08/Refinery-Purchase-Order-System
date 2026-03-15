const express = require("express");
const router = express.Router();
const UserAPIRouter = require("./user.routes");

router.use("/", UserAPIRouter);

module.exports = router;
