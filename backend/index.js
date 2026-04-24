const express = require("express");
const cors = require("cors");

const { USER_ID, EMAIL_ID, COLLEGE_ROLL_NUMBER } = require("./constants");
const { buildBfhlPayload } = require("./pipeline");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

app.get("/bfhl", (_req, res) => {
  res.status(200).json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
  });
});

app.post("/bfhl", (req, res) => {
  try {
    const data = req.body?.data;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Request body must be { "data": [...] }' });
    }

    return res.status(200).json(buildBfhlPayload(data));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BFHL API running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
