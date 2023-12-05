const express = require("express");
const categoryController = require("../controllers/categorys");
const { authenticateToken } = require("../middlewares");
const categoryRouter = express.Router();

categoryRouter.get("/", authenticateToken, categoryController.find);
categoryRouter.post("/", authenticateToken, categoryController.create);
categoryRouter.delete("/:id", authenticateToken, categoryController.delete);
categoryRouter.put("/:id", authenticateToken, categoryController.edit);

module.exports = categoryRouter;
