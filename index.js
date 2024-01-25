const express = require("express");
const { mainModule } = require("process");
const { Client, LocalAuth, LinkingMethod } = require("whatsapp-web.js");
const app = express();

async function getNumber() {
    fetch("https://localhost:7021/api/Guest/getWhatsappNumber", {
        Method: 'GET',
        Headers: {
            Accept: 'application.json',
            'Content-Type': 'application/json'
        }})
        .then((response) => {
            if (response.ok) {
                phoneNumber = response.text()
            }
        }).catch(err => {
            console.log(err);
        });
}

module.exports = async function main(number,path) {
    const whatsapp = new Client({
        authStrategy: new LocalAuth(),
        linkingMethod: new LinkingMethod({
            phone: {
                number: number,
            },
        }),
        puppeteer: {
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            executablePath:path
        
        },
    });

    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.send({
            status: err.status || 500,
            message: err.message,
        });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));


    let verfiyCode = "";
    let isReady = false;
    let isAuthenticated = false;

    whatsapp.initialize();

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
 //   callback(null, 1);

}

