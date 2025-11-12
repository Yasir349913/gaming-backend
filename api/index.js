// Vercel serverless function entry point
import app from "../src/app.js";
import { connectDB } from "../src/config/db.config.js";

// Connect to database when the function is invoked
let dbConnected = false;

const connectDatabase = async () => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
            console.log("Database connected");
        } catch (error) {
            console.error("Database connection error:", error);
            // Don't throw - allow the request to proceed even if DB connection fails
            // The app will handle the error appropriately
        }
    }
};

// Export the Express app as a serverless function
export default async (req, res) => {
    // Connect to database on first request
    await connectDatabase();

    // Handle the request with Express app
    app(req, res);
};

