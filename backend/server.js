const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Secure Evidence System Backend is running"
  });
});

// Calculate SHA-256 hash
function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);

  return crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");
}

// Test endpoint
app.get("/test-hash", (req, res) => {
  const filePath = "../test-evidence.txt";

  try {
    const hash = calculateHash(filePath);

    res.json({
      filename: "test-evidence.txt",
      sha256: hash
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});