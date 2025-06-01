const identify = require("../controller/identify");

const express = require("express");

const routes = express.Router();

routes.post("/identify", identify);

module.exports = routes;
