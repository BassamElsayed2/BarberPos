const { connectDB } = require("./config/database");

async function testConnection() {
  try {
    console.log("Testing database connection...");
    await connectDB();
    console.log("✅ Database connection successful");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testConnection();
