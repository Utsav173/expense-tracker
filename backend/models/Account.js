const Joi = require("joi");
const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    analytics: { type: mongoose.Schema.Types.ObjectId, ref: "Analytics" },
    balance: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

function validateAccount(account) {
  const schema = Joi.object({
    name: Joi.string().required().label("Name"),
    balance: Joi.number().optional().default(0).label("Balance"),
  });
  return schema.validate(account);
}

module.exports.validateAccount = validateAccount;
module.exports.Account = mongoose.model("Account", AccountSchema);
