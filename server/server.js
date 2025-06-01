const express = require("express");
const app = express();
const cors = require("cors");
const identifyRoutes = require("./routes/identifyRoutes");
app.use(express.json());

app.use(cors());

app.use("/api", identifyRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
