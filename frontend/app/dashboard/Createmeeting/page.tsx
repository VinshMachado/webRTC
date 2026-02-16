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

  useEffect(() => {
    if (!socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND);
      setSocket(newSocket);
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

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
      audio: true,
    });

    if (localVideo.current) {
      localVideo.current.srcObject = stream;
    }

    if (peerConnection.current) {
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });
    }
  };

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

  const handelRecieveOffer = async (data: { Room: string; offer: any }) => {
    try {
      console.log("📨 Received offer from:", data.Room);

      if (!peerConnection.current) {
        console.error("❌ Peer connection not initialized!");
        return;
      }

      // Set remote description
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.offer),
      );
      console.log("✅ Remote description set");

      // Create and set answer
      const answer = await peerConnection.current.createAnswer();
      console.log("✅ Answer created:", answer);

      await peerConnection.current.setLocalDescription(answer);
      console.log("✅ Local description set (answer)");

      // Send answer back
      const Room = data.Room;
      await socket?.emit("answer", { Room, answer });
      console.log("📤 Sent answer back to:", Room);

      debugPeerConnection();
    } catch (error) {
      console.error("❌ Error in handelRecieveOffer:", error);
    }
  };

  const establishPeer = async () => {
    try {
      peerConnection.current = new RTCPeerConnection(configuration);
      console.log("✅ Peer connection created");

      // Set up ICE candidate handler BEFORE any offer/answer
      peerConnection.current.onicecandidate = (event) => {
        console.log("🟡 ICE candidate event:", event.candidate);
        if (event.candidate) {
          if (socket) {
            socket.emit("ice-candidate", {
              Room: roomId,
              candidate: event.candidate,
            });
            console.log("📤 Sent ICE candidate:", event.candidate);
          }
        }
      };

      // Handle remote tracks
      peerConnection.current.ontrack = (event) => {
        console.log("🎥 Received remote track:", event.track.kind);
        console.log("📊 Streams available:", event.streams.length);
        if (remoteVideo.current && event.streams.length > 0) {
          console.log("✅ Setting remote video stream");
          remoteVideo.current.srcObject = event.streams[0];
        } else if (!event.streams[0]) {
          console.warn(
            "⚠️ No stream available in track event, using track directly",
          );
        }
      };
    } catch (error) {
      console.error("❌ Error in establishPeer:", error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    establishPeer();

    socket?.on("Greeting", (message: string) => {
      alert(message);
      console.log(message);
    });

    socket.on("recieveOffer", async (data) => {
      handelRecieveOffer(data);
    });

    // Handle remote ICE candidates from peer
    socket.on("ice-candidate", async (data) => {
      try {
        console.log("📨 Received ICE candidate from peer:", data.candidate);
        if (peerConnection.current && data.candidate) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
          console.log("✅ Added remote ICE candidate");
        }
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    });

    // Cleanup listeners
    return () => {
      socket.off("Greeting");
      socket.off("recieveOffer");
      socket.off("ice-candidate");
    };
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
              playsInline
              muted={false}
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
