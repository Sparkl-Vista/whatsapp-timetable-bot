const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "12345";

const WHATSAPP_TOKEN = "EAAapGuDUfYsBRsrOJP8oP7CZCQBAVtQBUAcQNJZCUx3Cz9wicrZAu9sMMoORA9HqlWnZCdZBo3MXb92Ie7cPMwBZBcAobUpxZCXLreZCkbxpVfv8PHOtmg3bceiPJzUAeYd8G7E7ZA8MUGfOdV3SM7FHbTXRceKyZBSeJl3Gph42Qam63uQA4ZAFcZBgkmJLHY1ik0iLVjbuelrupbVZACmMIdvQ2fRQEyZBdL3GIJ1Rhy7156JD0UA644TgmbcsLhJWF93Ntcmli73hQ8rj1bRiNrN7tWydbiY5mGPf6epi2BfBUZD";
const PHONE_NUMBER_ID = "1147795415080830";

const studentData = {
  prateek: {
    name: "Prateek",
    timetable: `
Today's Schedule:
09:00 AM - Maths
10:00 AM - Physics
11:00 AM - English
`
  },
  rahul: {
    name: "Rahul",
    timetable: `
Today's Schedule:
09:00 AM - Maths
10:00 AM - Physics
11:00 AM - English
`
  },
  amit: {
    name: "Amit",
    timetable: `
Today's Schedule:
08:00 AM - Biology
09:00 AM - Chemistry
10:00 AM - Hindi
`
  }
};

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
      const text = message.text.body.trim().toLowerCase();

      let reply = getScheduleReply(text);

      await sendMessage(from, reply);
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.sendStatus(500);
  }
});

function getScheduleReply(text) {
  const keywords = ["today", "schedule", "timetable", "slot", "class", "classes"];

  const hasKeyword = keywords.some(word => text.includes(word));

  if (!hasKeyword) {
    return "Hello! Send message like: Today Prateek schedule";
  }

  for (const key in studentData) {
    if (text.includes(key)) {
      const student = studentData[key];
      return `Hello ${student.name}\n\n${student.timetable}`;
    }
  }

  return "Student not found. Please send like: Today Prateek schedule";
}

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
