const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "12345";

// Meta se copy karo
const WHATSAPP_TOKEN = "PASTE_ACCESS_TOKEN_HERE";
const PHONE_NUMBER_ID = "1147795415080830";

const studentData = {
  "ST001": {
    password: "1234",
    name: "Rahul",
    timetable: `
Today's Timetable:
09:00 AM - Maths
10:00 AM - Physics
11:00 AM - English
`
  },
  "ST002": {
    password: "5678",
    name: "Amit",
    timetable: `
Today's Timetable:
08:00 AM - Biology
09:00 AM - Chemistry
10:00 AM - Hindi
`
  }
};

let userState = {};

app.get("/", (req, res) => {
  res.send("WhatsApp Timetable Bot Running");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const from = message.from;
      const text = message.text.body.trim();

      let reply = "";

      if (!userState[from]) {
        userState[from] = { step: "start" };
      }

      if (text.toLowerCase().includes("timetable") || text.toLowerCase().includes("today")) {
        userState[from] = { step: "ask_student_id" };
        reply = "Please enter your Student ID.";
      } 
      else if (userState[from].step === "ask_student_id") {
        userState[from].studentId = text;
        userState[from].step = "ask_password";
        reply = "Please enter your password.";
      } 
      else if (userState[from].step === "ask_password") {
        const studentId = userState[from].studentId;
        const password = text;

        if (studentData[studentId] && studentData[studentId].password === password) {
          reply = `Hello ${studentData[studentId].name}\n\n${studentData[studentId].timetable}`;
        } else {
          reply = "Invalid Student ID or Password. Please type 'timetable' to try again.";
        }

        userState[from] = { step: "start" };
      } 
      else {
        reply = "Hello! Type 'today timetable' to get your class schedule.";
      }

      await sendMessage(from, reply);
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.sendStatus(500);
  }
});

async function sendMessage(to, body) {
  await axios.post(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      text: { body: body }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

app.listen(3000, () => {
  console.log("Server running on port 3000");
});