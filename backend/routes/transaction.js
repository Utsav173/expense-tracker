const express = require("express");
const {
  createTransaction,
  findTransactions,
  findIncomeAndExpense,
  getByCategory,
  deleteTransaction,
  editTransaction,
  getByField,
  findIncomeAndExpenseDuration,
  getFakeData,
  findOneTransaction,
} = require("../controllers/transactions");
const { authenticateToken } = require("../middlewares");
const transactionRoutes = express.Router();

transactionRoutes.get("/", authenticateToken, findTransactions);
transactionRoutes.get("/:id", authenticateToken, findOneTransaction);
transactionRoutes.get("/by/:field", authenticateToken, getByField);
transactionRoutes.get("/by/category/chart", authenticateToken, getByCategory);
transactionRoutes.get("/by/income/expense", authenticateToken, findIncomeAndExpense);
transactionRoutes.get("/by/income/expense/chart", authenticateToken, findIncomeAndExpenseDuration);
transactionRoutes.get("/fakeData/by", getFakeData);
transactionRoutes.post("/", authenticateToken, createTransaction);
transactionRoutes.put("/:id", authenticateToken, editTransaction);
transactionRoutes.delete("/:id", authenticateToken, deleteTransaction);

module.exports = transactionRoutes;
