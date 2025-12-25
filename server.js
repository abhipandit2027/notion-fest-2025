// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const QRCode = require("qrcode");
const db = require("./db");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Get event info (used by frontend)
app.get("/api/event", (req, res) => {
  db.get(`SELECT * FROM events LIMIT 1`, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.json(row);
  });
});

// Registration endpoint
app.post("/api/register", (req, res) => {
  const { name, email, regNo } = req.body;
  if (!name || !email || !regNo) {
    return res.status(400).json({ message: "All fields are required." });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get(`SELECT * FROM events LIMIT 1`, (err, event) => {
      if (err || !event) {
        console.error(err);
        db.run("ROLLBACK");
        return res.status(500).json({ message: "Event not found." });
      }

      db.get(
        `SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?`,
        [event.id],
        (err2, row) => {
          if (err2) {
            console.error(err2);
            db.run("ROLLBACK");
            return res
              .status(500)
              .json({ message: "Error checking capacity." });
          }

          if (row.count >= event.capacity) {
            db.run("ROLLBACK");
            return res
              .status(409)
              .json({ message: "Registrations are full. No seats available." });
          }

          const insertStmt = `
            INSERT INTO registrations (event_id, name, email, reg_no)
            VALUES (?, ?, ?, ?)
          `;
          db.run(insertStmt, [event.id, name, email, regNo], function (err3) {
            if (err3) {
              console.error("Insert error:", err3);
              db.run("ROLLBACK");

              if (err3.message && err3.message.includes("UNIQUE")) {
                return res.status(409).json({
                  message:
                    "This email is already registered for Notion Fest 2025.",
                });
              }

              return res
                .status(500)
                .json({ message: "Error saving registration." });
            }

            const registrationId = this.lastID;
            const uniquePayload = JSON.stringify({
              registrationId,
              eventId: event.id,
              email,
            });

            QRCode.toDataURL(
              uniquePayload,
              { width: 256 },
              (qrErr, qrDataUrl) => {
                if (qrErr) {
                  console.error(qrErr);
                  db.run("ROLLBACK");
                  return res
                    .status(500)
                    .json({ message: "Error generating QR code." });
                }

                db.run("COMMIT");
                return res.json({
                  ticket: {
                    participantName: name,
                    eventName: event.name,
                    date: event.date,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    qrDataUrl,
                    registrationId,
                  },
                });
              }
            );
          });
        }
      );
    });
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Notion Fest 2025 server running at http://localhost:${PORT}`);
});
