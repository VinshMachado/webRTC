"use client";
import React, { useEffect, useRef, useState } from "react";
import UserDetails from "../../../Storage/Store";
import { io } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import { off } from "process";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const Page = () => {
  const socket = io(process.env.NEXT_PUBLIC_BACKEND);
  const Userdata = UserDetails((state) => state.Userdata);

  const [roomId, setRoomid] = useState<string | null>();

  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const GetCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const webrtcConnection = async (roomId: string) => {
    // web rtc thing
    peerConnection.current = new RTCPeerConnection(configuration);
    if (peerConnection) {
      const offer = await peerConnection.current.createOffer();

      await peerConnection.current.setLocalDescription(offer);

      socket.emit("offer", { roomId, offer });

      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice", { roomId, candidate: e.candidate });
      };
      peerConnection.current.ontrack = (e) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = e.streams[0];
        }
      };
    }
  };

  // room creation and stuff
  useEffect(() => {
    console.log(Userdata); // logs whenever userdata updates\

    const randomstring = `
      ${Math.random()
        .toString(36)
        .substring(2, 2 + 9)}
    `;
    setRoomid(randomstring);

    console.log(roomId);

    socket.emit("join-room", { id: randomstring });
    webrtcConnection(randomstring);
  }, []);

  // socket things
  useEffect(() => {
    GetCamera();
    socket.on("answer", async (answer) => {
      await peerConnection.current?.setRemoteDescription(answer);
      console.log(answer);
    });

    socket.off("amswer");
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
        <div>Loading....</div>
      )}
    </>
  );
};

export default Page;
