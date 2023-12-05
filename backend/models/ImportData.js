const mongoose = require("mongoose");

const ImportDataSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    data: { type: String, required: true },
    totalRecords: { type: Number, default: 0 },
    errorRecords: { type: Number, default: 0 },
    isImported: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports.ImportData = mongoose.model("ImportData", ImportDataSchema);
