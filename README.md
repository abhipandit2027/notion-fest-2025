The initial interface 

<img width="600" height="400" alt="Screenshot 2025-12-25 230418" src="https://github.com/user-attachments/assets/3212df46-d838-4f9c-b16c-257df4e5593b" />

QR code 

<img width="600" height="400" alt="Screenshot 2025-12-25 230523" src="https://github.com/user-attachments/assets/c15c3f39-922a-4cb8-94b4-c1fac169aa0f" />

the live link deployed from vercel - https://notion-fest-2025-mvlb.vercel.app/

Concurrency (edge cases) - 
Every registration runs inside a single DB transaction: start transaction → read event → count existing registrations for that event → if count >= capacity then rollback and return 409 “full”; otherwise insert the new row, generate QR, and commit, so only one request can ever successfully take the last available seat.A UNIQUE(event_id, email) constraint on registrations stops the same email from registering twice for the same event; the database rejects duplicates and the API turns that into a clear “already registered” error.

Why this database schema - 
Two tables keep things clean: events holds shared event data (name, date, time, capacity), and registrations holds per‑participant data linked by event_id, so checking seats is just “capacity vs. COUNT of registrations for that event”.Putting capacity on events and uniqueness on (event_id, email) lets the database enforce core rules (no over‑capacity, no duplicate user per event) instead of relying only on application logic, which makes the system simpler and safer under concurrent requests.

