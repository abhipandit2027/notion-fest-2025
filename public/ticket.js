// public/ticket.js

const apiBase = window.location.origin;

// Load event meta on page load
window.addEventListener("DOMContentLoaded", async () => {
  const eventMetaEl = document.getElementById("event-meta");

  try {
    const res = await fetch(`${apiBase}/api/event`);
    if (!res.ok) throw new Error("Failed to load event info");
    const event = await res.json();

    eventMetaEl.textContent = `${event.name} • ${event.date} • ${event.start_time} – ${event.end_time}`;
  } catch (e) {
    console.error(e);
    eventMetaEl.textContent = "Event information currently unavailable.";
  }
});

const form = document.getElementById("registration-form");
const formMessage = document.getElementById("form-message");
const registerBtn = document.getElementById("register-btn");

const ticketCard = document.getElementById("ticket-card");
const ticketNameEl = document.getElementById("ticket-name");
const ticketEventEl = document.getElementById("ticket-event");
const ticketDatetimeEl = document.getElementById("ticket-datetime");
const ticketIdEl = document.getElementById("ticket-id");
const ticketQrEl = document.getElementById("ticket-qr");
const downloadBtn = document.getElementById("download-ticket-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "text-sm mt-1 h-5";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const regNo = document.getElementById("regNo").value.trim();

  if (!name || !email || !regNo) {
    formMessage.textContent = "Please fill in all fields.";
    formMessage.classList.add("text-red-400");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Processing...";

  try {
    const res = await fetch(`${apiBase}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, regNo }),
    });

    const data = await res.json();

    if (!res.ok) {
      formMessage.textContent =
        data.message || "Something went wrong. Please try again.";
      formMessage.classList.add("text-red-400");
    } else {
      const t = data.ticket;
      ticketNameEl.textContent = t.participantName;
      ticketEventEl.textContent = t.eventName;
      ticketDatetimeEl.textContent = `${t.date} • ${t.startTime} – ${t.endTime}`;
      ticketIdEl.textContent = `Registration ID: ${t.registrationId}`;
      ticketQrEl.src = t.qrDataUrl;

      ticketCard.classList.remove("hidden");
      downloadBtn.classList.remove("hidden");

      formMessage.textContent =
        "Registration successful! Your ticket is ready below.";
      formMessage.classList.add("text-emerald-400");
    }
  } catch (error) {
    console.error(error);
    formMessage.textContent = "Network error. Please try again.";
    formMessage.classList.add("text-red-400");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Confirm Registration";
  }
});

// Download ticket as PNG using html2canvas
downloadBtn.addEventListener("click", async () => {
  if (ticketCard.classList.contains("hidden")) return;

  try {
    const canvas = await html2canvas(ticketCard, {
      backgroundColor: "#0a0a0a",
      scale: 2,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "NotionFest2025_Ticket.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Error downloading ticket:", e);
    alert("Could not download ticket. Please take a screenshot instead.");
  }
});
