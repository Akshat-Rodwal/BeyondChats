// Server entry: loads env, connects DB, starts Express app
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const { connectDB } = require("./utils/db");

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await connectDB();
    } catch (err) {
        console.error("DB connection failed:", err.message);
    }
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
