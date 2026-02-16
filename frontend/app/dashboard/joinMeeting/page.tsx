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
  const [socket, setSocket] = useState<any | null>(null);

  const Userdata = UserDetails((state) => state.Userdata);

  const [roomId, setRoomid] = useState<string | null>();
  const [inputString, setInputString] = useState<string | null>();

  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const GetCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true, // Don't forget audio!
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    // ✅ Add tracks to peer connection if it exists
    if (peerConnection.current) {
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });
    }
  };

  const join_room = async () => {
    const tempRoom = inputString;

    await socket?.emit("join-room", { id: tempRoom, name: Userdata.name });

    peerConnection.current = new RTCPeerConnection(configuration);

    GetCamera();

    peerConnection.current.onicecandidate = (event) => {
      console.log("thing ran");
      if (event.candidate) {
        socket?.emit("ice-candidate", {
          Room: tempRoom,
          candidate: event.candidate,
        });
      }
    };
    const offer = await peerConnection.current?.createOffer();

    if (offer)
      await peerConnection.current?.setLocalDescription(
        new RTCSessionDescription(offer),
      );
    const Room = inputString;
    await socket?.emit("offer", { Room, offer });
  };

  useEffect(() => {
    if (!socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND);
      setSocket(newSocket);
    }

    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const debugPeerConnection = () => {
    if (!peerConnection.current) {
      console.log("❌ Peer connection is null");
      return;
    }

    console.log("=== Peer Connection Debug ===");
    console.log("Connection State:", peerConnection.current.connectionState);
    console.log(
      "ICE Connection State:",
      peerConnection.current.iceConnectionState,
    );
    console.log(
      "ICE Gathering State:",
      peerConnection.current.iceGatheringState,
    );
    console.log("Signaling State:", peerConnection.current.signalingState);
    console.log(
      "\nLocal Description:",
      peerConnection.current.localDescription,
    );
    console.log(
      "Remote Description:",
      peerConnection.current.remoteDescription,
    );
    console.log("========================");
  };

  useEffect(() => {
    if (!socket) return;
    console.log(socket);
    socket?.on("Greeting", async (message: string) => {
      alert(message);

      console.log(message);
    });

    socket?.on("recieveAnswer", async (data: { Room: string; answer: any }) => {
      console.log("recieved ans:", data.answer);
      await peerConnection.current?.setRemoteDescription(data.answer);

      debugPeerConnection();

      if (peerConnection.current) {
        peerConnection.current.ontrack = (event) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = event.streams[0];
          }
        };
      }
    });
  }, [socket]);

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
            }}
          >
            Join a meeting
          </button>
        </div>
      )}
    </>
  );
};

export default page;
