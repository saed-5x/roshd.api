// ﻿const { MongoStore } = require("wwebjs-mongo");
// const mongoose = require("mongoose");
// const uri =
//   "mongodb+srv://saed5x:4sCua1uBQ0s3V7Nw@cluster0.bwcosw8.mongodb.net/?retryWrites=true&w=majority";
// const clientOptions = {
//   serverApi: { version: "1", strict: true, deprecationErrors: true },
// };

/**
 *
 */
const {
  Client,
  LocalAuth,
  LinkingMethod,
  RemoteAuth,
} = require("whatsapp-web.js");

const express = require("express");
const app = express();
let whatsapp;
let initialized = "";
let verfiyCode = "";
let isReady = false;
let isAuthenticated = false;
async function initialize() {
  let number;
  await fetch("https://mpsappw.bsite.net/api/Guest/getWhatsappNumber", {
    Method: "GET",
    Headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
    })
    .then(async (data) => {
      number = data;
      const authStrategy = new LocalAuth({
          clientId: "adminSession"
        });
             whatsapp = new Client({
              authStrategy,
              restartOnAuthFail: true,
              takeoverOnConflict: true,
              linkingMethod: new LinkingMethod({
                  phone: {
                      number: number,
                  },
              }),
              puppeteer: {
                  handleSIGINT: false,
                  headless: true,
                  args: ["--no-sandbox", "--disable-setuid-sandbox"]
                  //,executablePath:"D:\\Code_Work_Storage\\Moath_School_Intouch_NApp\\version_0.1\\.local-chromium\\win64-982053\\chrome-win\\chrome.exe"
              },
          })
      // await mongoose
      //   .connect(uri, clientOptions)
      //   .then(() => {
      //     const store = new MongoStore({ mongoose: mongoose });
      //     whatsapp = new Client({
      //       authStrategy: new RemoteAuth({
      //         store: store,
      //         backupSyncIntervalMs: 300000,
      //       }),
      //       restartOnAuthFail: true,
      //       takeoverOnConflict: true,
      //       linkingMethod: new LinkingMethod({
      //         phone: {
      //           number: number,
      //         },
      //       }),
      //       puppeteer: {
      //         handleSIGINT: false,
      //         headless: true,
      //         args: ["--no-sandbox", "--disable-setuid-sandbox"],
      //         //,executablePath:"D:\\Code_Work_Storage\\Moath_School_Intouch_NApp\\version_0.1\\.local-chromium\\win64-982053\\chrome-win\\chrome.exe"
      //       },
      //     });
      //     whatsapp.initialize();
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });
      console.log(data);
      initialized = true;

    })
    .catch((err) => {
      console.log(err);
    });
}

async function main() {
  var s = await initialize();
  whatsapp.on("code", (code) => {
    console.log(code);
    verfiyCode = code;
  });

  whatsapp.on("authenticated", (session) => {
    isAuthenticated = true;
  });

  whatsapp.on("auth_failure", (msg) => {
    isAuthenticated = false;
  });

  whatsapp.on("ready", () => {
    console.log("is ready");
    isReady = true;
  });

  whatsapp.on("remote_session_saved", () => {
    console.log("session saved");
  });

  whatsapp.on("message", (message) => {
    if (message.body === "!خدمات") {
      message.reply("قائمة الخدمات\n[0] الحصول على الواجب\n[1] جدول الحصص");
    }
  });
  process.on("SIGINT", async () => {
    console.log("(SIGINT) Shutting down...");
    await whatsapp.destroy();
    process.exit(0);
  });
}

main();
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
app.get("/status", (req, res) => {
  res.send(isAuthenticated);
});
app.get("/running", (req, res) => {
  res.send("Is Running");
});
app.get("/login", (req, res) => {
  if (verfiyCode !== "") {
    res.send(verfiyCode);
  } else {
    res.send("error");
  }
});
app.get("/running", (req, res) => {
  res.send("Is Running");
});
app.get("/isReady", (req, res) => {
  if (isReady) {
    res.send(true);
  } else {
    res.send(false);
  }
});

app.get("/initialize", (req, res) => {
  if (!isReady) {
    initialize();
  } else {
    res.send(false);
  }
});

app.post("/send", async (req, res, next) => {
  let response = [];
  req.body.forEach(async (item, i = 0) => {
    response.push({
      Message: item.Message,
      Chat: item.number,
      Status: true,
      Exception: "",
    });

    if (item.Chat || item.Message) {
      try {
        await whatsapp.sendMessage(
          item.Chat.substring(1) + "@c.us",
          item.Message
        );
      } catch (ex) {
        response[i].Exception = ex;
        response[i].Status = false;
      }
    } else {
      response[i].Exception = "خطاء في المدخلات";
      response[i].Status = false;
    }
    i++;
  });
  res.send(response);
});
