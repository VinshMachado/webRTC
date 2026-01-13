"use client";
import React, { useEffect } from "react";
import { useRef, useState } from "react";

import UserDetails from "@/Storage/Store";
import { io, Socket } from "socket.io-client";
const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const page = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const Userdata = UserDetails((state) => state.Userdata);

  const [roomId, setRoomid] = useState<string | null>();
  const [inputString, setInputString] = useState<string | null>(null);

  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const join_room = async () => {
    const tempRoom = inputString;

    await socket?.emit("join-room", { id: tempRoom, name: Userdata.name });
  };

  const GetCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }
  };

  useEffect(() => {
    if (!socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND);
      setSocket(newSocket);
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  const handelRecieveOffer = async (data: { Room: string; offer: any }) => {
    console.log("this is backend:", data);

    await peerConnection.current?.setRemoteDescription(data.offer);
    const answer = await peerConnection.current?.createAnswer();

    await peerConnection.current?.setLocalDescription(answer);

    console.log(roomId);
    const Room = data.Room;
    console.log("sent answer", answer);
    await socket?.emit("answer", { Room, answer });
  };

  useEffect(() => {
    if (!socket) return;
    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", {
          Room: inputString,
          candidate: event.candidate,
        });
      }
    };

    socket?.on("Greeting", (message: string) => {
      alert(message);
      console.log(message);
    });

    socket.on("recieveOffer", async (data) => {
      handelRecieveOffer(data);
    });
  }, [socket]);

  useEffect(() => {
    GetCamera();
  }, []);

  return (
    <>
      {roomId ? (
        <>
          <div className="w-full h-20 bg-slate-900">{Userdata.name} </div>

          <h1 className="ml-7">Your RoomId:{roomId}</h1>

          <div className="flex justify-center bg-gray-950 w-full h-[90vh]  items-center p-5 flex-wrap">
            <video
              ref={localVideo}
              className="w-[1000px] h-[80vh] rounded-xl m-10"
              autoPlay
            ></video>

            <video
              ref={remoteVideo}
              className="w-[1000px] h-[80vh] rounded-xl m-10"
              autoPlay
            ></video>
            <div className="bg-gray-800 h-[80vh] w-[600px]  rounded-xl"></div>
          </div>
        </>
      ) : (
        <div className="w-full h-[100vh] bg-slate-900 flex justify-center items-center">
          <input
            className="w-[250px] h-20 m-5 h-[50px] border-none bg-blue-950 p-3 rounded-2xl"
            placeholder="Enter Room Id"
            onChange={(e) => {
              setInputString(e.target.value);
            }}
          />

          <button
            className="px-6 py-3 rounded-lg bg-gray-700 text-gray-200 font-medium
             hover:bg-gray-600 transition
             shadow-lg shadow-black/40
             active:scale-95"
            onClick={async () => {
              setRoomid(inputString);

              join_room();
              await GetCamera();
            }}
          >
            Create a meeting ID
          </button>
        </div>
      )}
    </>
  );
};

export default page;
