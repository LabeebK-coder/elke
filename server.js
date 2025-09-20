const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Routes for each page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/perfumes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "perfumes.html"));
});

app.get("/skincare", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "skincare.html"));
});

app.get("/roomfresheners", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "roomfresheners.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

app.listen(PORT, () => {
  console.log(`Elke Collections running at http://localhost:${PORT}`);
});
