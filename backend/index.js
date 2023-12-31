const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const accountRoutes = require("./routes/account");
const { User } = require("./models/User");
const { Category } = require("./models/Category");
const transactionRoutes = require("./routes/transaction");
const categoryRouter = require("./routes/category");
const cron = require("node-cron");
const authRouter = require("./routes/auth");
const axios = require("axios");
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit process on MongoDB connection error
  });

app.use("/accounts", accountRoutes);
app.use("/transactions", transactionRoutes);
app.use("/category", categoryRouter);
app.use("/auth", authRouter);

const server = http.createServer(app);

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});

cron.schedule("*/15 * * * *", async () => {
  try {
    const response = await axios.get("https://exp-v-4.onrender.com/auth/test");
    console.log(response.data);
  } catch (error) {
    console.error("Error:", error.message);
  }
});

const PORT = process.env.PORT || 1337;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const admin = await User.findOne({
      email: "superadmin@gmail.com",
      role: "admin",
    });

    if (!admin) {
      await User.create({
        email: "superadmin@gmail.com",
        name: "Super Admin",
        password:
          "$2a$10$pYQkBJ5Od.jgLJOk4mkVNuR2ROcORjjIOu3qR9Vzsg5nba08Pqj0.",
        role: "admin",
      });
    }

    if (admin) {
      const categories = [
        { name: "Groceries", createdBy: admin.id },
        { name: "Utilities", createdBy: admin.id },
        { name: "Rent/Mortgage", createdBy: admin.id },
        { name: "Transportation", createdBy: admin.id },
        { name: "Healthcare/Medical", createdBy: admin.id },
        { name: "Entertainment", createdBy: admin.id },
        { name: "Eating Out", createdBy: admin.id },
        { name: "Clothing", createdBy: admin.id },
        { name: "Education", createdBy: admin.id },
        { name: "Gifts/Donations", createdBy: admin.id },
        { name: "Travel", createdBy: admin.id },
        { name: "Insurance", createdBy: admin.id },
        { name: "Home Improvement", createdBy: admin.id },
        { name: "Savings", createdBy: admin.id },
        { name: "Other", createdBy: admin.id },
      ];

      const hasCategory = await Category.find();

      if (!hasCategory.length) {
        await Category.create(categories);
      }
    }
  } catch (error) {
    throw error;
  }
});
