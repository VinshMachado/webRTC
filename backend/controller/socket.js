import { Server } from "socket.io";
let io = null;

const InitalizeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  io.on("connection", (socket) => {
    console.log("socket: ", socket.id);
    socket.on("join-room", (data) => {
      console.log(data.id);
      const roomID = data?.id?.trim();

      socket.join(roomID);

      //console.log(`${socket.id} joined the room`, roomID);
      socket.to(`${roomID}`).emit("Greeting", {
        message: `${data.name} Joined the meeting`,
        name: data.name,
        profile: data.profile,
      });
    });

    socket.on("offer", (data) => {
      //console.log("offer side:", data);
      socket.to(data.Room).emit("recieveOffer", data);
    });

    socket.on("sendMessage", (data) => {
      //console.log("answer side:", data);
      socket.to(data.roomId).emit("recieveMessage", data.text);
    });

    socket.on("answer", (data) => {
      //console.log("answer side:", data);
      socket.to(data.Room).emit("recieveAnswer", data);
    });

    socket.on("ice-candidate", ({ Room, candidate }) => {
      socket.to(Room).emit("ice-candidate", { candidate });
    });
  });
};

export default InitalizeSocket;
