﻿const express = require("express");
const { Client, LocalAuth, LinkingMethod } = require("whatsapp-web.js");
const app = express();
let whatsapp;
let initialized ="";
let verfiyCode = "";
let isReady = false;
let isAuthenticated = false;
async function initialize() {
   await fetch("https://mpsappw.bsite.net/api/Guest/getWhatsappNumber", {
        Method: 'GET',
        Headers: {
            Accept: 'application.json',
            'Content-Type': 'application/json'
        }}).then((response)=>{
            if (response.ok) {
                return response.text()
            }
        })
        .then((data)  =>  {
                console.log(data);
                whatsapp = new Client({
                    authStrategy: new LocalAuth(),
                    linkingMethod: new LinkingMethod({
                        phone: {
                            number: data,
                        },
                    }),
                    puppeteer: {
                        headless: true,
                        args: ["--no-sandbox", "--disable-setuid-sandbox"]
                                        },
                });
                initialized = true;
            
        }).catch(err => {
            console.log(err);
        });
}

async function main() {
   var s =  await initialize();
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

    whatsapp.on("message", (message) => {
        if (message.body === "!خدمات") {
            message.reply("قائمة الخدمات\n[0] الحصول على الواجب\n[1] جدول الحصص");
        }
    });
    whatsapp.initialize();
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
      res.send('Is Running');
  });
  app.get("/login", (req, res) => {
      if (verfiyCode !== "") {
          res.send(verfiyCode);
      } else {
          res.send("error");
      }
  });
  app.get("/running", (req, res) => {
      res.send('Is Running');
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
                      item.Message,
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