const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const routes = require("./routes");
const errorHandler = require("./middlewares/error-handler");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", routes);
app.use(errorHandler);

module.exports = app;
