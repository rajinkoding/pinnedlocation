const express = require("express");
const app = express();
let bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const multer = require("multer");
app.use(express.static("uploads"));
const mystorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});
const upd = multer({
  storage: mystorage,
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const port = 3000;
app.listen(port, function () {
  console.log(`Server running at port ${port}: http://127.0.0.1:${port}`);
});

const developers = require("../routes/developers");
app.post(
  "/api/developer/register",
  upd.single("uploadktp"),
  developers.register
);
app.post("/api/developer/login", developers.login);

const users = require("../routes/users");
app.get("/api/user/:customId?", users.select_user);
app.post("/api/user/add", users.insert_user);
app.delete("/api/user/delete/:customId?", users.delete_user);
app.put("/api/user/update/:oldCustomId?", users.update_user);

const pinnedLocation = require("../routes/pinnedLocations");
app.get("/api/map/pinlocation", pinnedLocation.select_pinnedLocation);
app.post("/api/map/pinlocation/add", pinnedLocation.insert_pinnedLocation);
app.delete(
  "/api/map/pinlocation/delete/:id?",
  pinnedLocation.delete_pinnedLocation
);
app.put(
  "/api/map/pinlocation/update/:id?",
  pinnedLocation.update_pinnedLocation
);
app.get("/api/map/distance", pinnedLocation.get_distance);
