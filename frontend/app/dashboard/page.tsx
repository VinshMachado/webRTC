"use client";
import React, { useEffect, useRef, useState } from "react";
import UserDetails from "../../Storage/Store";
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BACKEND);

const Page = () => {
  const Userdata = UserDetails((state) => state.Userdata);
  const [roomId, setRoomid] = useState("");

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const pc = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    console.log(Userdata); // logs whenever userdata updates\

    const randomstring = `
      ${Math.random()
        .toString(36)
        .substring(2, 2 + 9)}
    `;
    setRoomid(randomstring);
  }, [Userdata]);

  useEffect(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => {
          pc.current?.addTrack(track, stream);
        });
      });

    pc.current.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    socket.on("offer", async (offer) => {
      await pc.current?.setRemoteDescription(offer);
      const answer = await pc.current?.createAnswer();
      await pc.current?.setLocalDescription(answer);
      socket.emit("answer", answer);
    });

    socket.on("answer", async (answer) => {
      await pc.current?.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      await pc.current?.addIceCandidate(candidate);
    });
  }, []);

  return (
    <>
      <div className="w-full h-20 bg-slate-900">{Userdata.name} </div>

      <h1 className="ml-7">Your RoomId:{roomId}</h1>

      <div className="flex justify-center bg-gray-950 w-full h-[90vh]  items-center p-5 flex-wrap">
        <video
          ref={localVideo}
          className="w-[1000px] h-[80vh] rounded-xl m-10"
          controls
        ></video>

        <video
          ref={remoteVideo}
          className="w-[1000px] h-[80vh] rounded-xl m-10"
          controls
        ></video>
        <div className="bg-gray-800 h-[80vh] w-[600px]  rounded-xl"></div>
      </div>
    </>
  );
};

export default Page;
