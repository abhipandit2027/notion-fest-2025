// db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "notionfest.db");
const db = new sqlite3.Database(dbPath);

// Initialize schema
db.serialize(() => {
  // Events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Registrations table
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      reg_no TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, email),
      FOREIGN KEY(event_id) REFERENCES events(id)
    )
  `);

  // Insert a default event if not exists
  db.get(`SELECT COUNT(*) AS count FROM events`, (err, row) => {
    if (err) {
      console.error("Error checking events table:", err);
      return;
    }
    if (row.count === 0) {
      db.run(
        `
        INSERT INTO events (name, date, start_time, end_time, capacity)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          "Notion Fest 2025",
          "2025-03-15",
          "10:00 AM",
          "5:00 PM",
          100, // capacity
        ],
        (err2) => {
          if (err2) {
            console.error("Error inserting default event:", err2);
          } else {
            console.log("Seeded default event: Notion Fest 2025");
          }
        }
      );
    }
  });
});

module.exports = db;
