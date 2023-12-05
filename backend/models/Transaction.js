const Joi = require("joi");
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    amount: { type: Number, required: true },
    isIncome: { type: Boolean, required: true },
    transfer: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

function validateTransaction(transaction) {
  const schema = Joi.object({
    text: Joi.string().required().label("Text"),
    amount: Joi.number().required().label("Amount"),
    isIncome: Joi.boolean().required().label("isIncome"),
    transfer: Joi.string().required().label("Transfer"),
    category: Joi.string().required().label("Category"),
    account: Joi.string().required().label("Account"),
  });
  return schema.validate(transaction);
}

function validateEditTransaction(transaction) {
  const schema = Joi.object({
    text: Joi.string().optional().label("Text"),
    amount: Joi.number().optional().label("Amount"),
    isIncome: Joi.boolean().optional().label("isIncome"),
    transfer: Joi.string().optional().label("Transfer"),
    category: Joi.string().optional().label("Category"),
  });
  return schema.validate(transaction);
}

const Transaction = mongoose.model("Transaction", TransactionSchema);
module.exports = {
  Transaction,
  validateEditTransaction,
  validateTransaction,
};
