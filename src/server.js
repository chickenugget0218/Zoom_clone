import express from "express";
import {WebSocketServer} from "ws";
import http from "http";

const app = express();

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req,res) => res.render("home"));
app.get("/*",(req,res) => res.redirect("/"));

const handleListen = () => console.log(`Listeneing on http://localhost:3000`);

//http ,websocket 둘다 돌릴수 있음
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function onSocketClose(){
    console.log("Disconneted from the Browser ❌");
}

const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket); // 브라우저연결시 array에 넣어줌
    //다른브라우저와도 연결 가능하게 함
    socket["nickname"] = "Anon";
    console.log("Connected to Browser ✅");
    socket.on("close", onSocketClose);
    socket.on("message", (msg) =>{
        const message = JSON.parse(msg);
        switch(message.type){
            case "new_message":
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
            case "nickname":
                socket["nickname"] = message.payload;
        }
    });
});

server.listen(3000, handleListen);

