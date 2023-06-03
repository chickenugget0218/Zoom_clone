import express from "express";
import {Server} from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import http from "http";

const app = express();

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req,res) => res.render("home"));
app.get("/*",(req,res) => res.redirect("/"));


//http ,websocket 둘다 돌릴수 있음
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: { //demo work
      origin: ["https://admin.socket.io"],
      credentials: true,
    },
  });
  
  instrument(wsServer, {
    auth: false,
    mode: "development",
  });

function publicRooms(){
    const {sockets: {adapter: {sids, rooms},
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach(( _, key) => {
    if(sids.get(key) === undefined) {
        publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => {
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(`Socket Event:${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); // 하나의 소켓에만 메세지 보냄
        wsServer.sockets.emit("room_change", publicRooms()); // 모든 소켓에 메세지 보냄
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname,  countRoom(room) - 1 ));
    });
    socket.on("disconnect", () =>{
       wsServer.sockets.emit("room_change", publicRooms()); 
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});


//const wss = new WebSocketServer({ server });
// const sockets = [];

// wss.on("connection", (socket) => {
//     sockets.push(socket); // 브라우저연결시 array에 넣어줌
//     //다른브라우저와도 연결 가능하게 함
//     socket["nickname"] = "Anon";
//     console.log("Connected to Browser ✅");
//     socket.on("close", onSocketClose);
//     socket.on("message", (msg) =>{
//         const message = JSON.parse(msg);
//         switch(message.type){
//             case "new_message":
//                 sockets.forEach((aSocket) =>
//                  aSocket.send(`${socket.nickname}: ${message.payload}`));
//             case "nickname":
//                 socket["nickname"] = message.payload;
//         }
//     });
// });


const handleListen = () => console.log(`Listeneing on http://localhost:3000`);

httpServer.listen(3000, handleListen);

