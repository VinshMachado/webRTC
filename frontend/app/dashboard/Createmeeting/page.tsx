"use client";
import React, { useEffect } from "react";
import { useRef, useState } from "react";

import UserDetails from "@/Storage/Store";
import { io, Socket } from "socket.io-client";
import { Hash } from "lucide-react";
import { AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar } from "@/components/ui/avatar";
import Videocomponent from "./videocomponent";
interface MessageSchema {
  message: string;
  image: string;
  sender: string;
}
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
  const [messages, SetMessages] = useState<MessageSchema[]>([]);
  const [text, setText] = useState("");
  const [inputString, setInputString] = useState<string | null>(null);

  useEffect(() => {
    setInputString(
      crypto.randomUUID().replace(/-/g, "").slice(0, 7).toUpperCase(),
    );
    if (!socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND);
      setSocket(newSocket);
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  const Userdata = UserDetails((state) => state.Userdata);
  const [RemoteData, serRemoteData] = useState<{
    message: string;
    name: string;
    profile: string;
  }>({
    message: "",
    name: "nubie",
    profile:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS36J6t0SbHUeuuQ0nq2j9ki507M79Pu-oT6g&s",
  });

  const remoteProfileRef = useRef<string>(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS36J6t0SbHUeuuQ0nq2j9ki507M79Pu-oT6g&s",
  );

  const [roomId, setRoomid] = useState<string | null>();

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

  const handelRecieveOffer = async (data: { Room: string; offer: any }) => {
    try {
      if (!peerConnection.current) {
        console.error(" Peer connection not initialize");
        return;
      }

      // Set remote description
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.offer),
      );

      // Create and set answer
      const answer = await peerConnection.current.createAnswer();

      await peerConnection.current.setLocalDescription(answer);

      // Send answer back
      const Room = data.Room;
      await socket?.emit("answer", { Room, answer, Userdata });
    } catch (error) {
      console.error(" Error in handelRecieveOffer:", error);
    }
  };

  const establishPeer = async () => {
    try {
      peerConnection.current = new RTCPeerConnection(configuration);

      // Set up ICE candidate handler BEFORE any offer/answer
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          if (socket) {
            socket.emit("ice-candidate", {
              Room: roomId,
              candidate: event.candidate,
            });
          }
        }
      };

      // Handle remote tracks
      peerConnection.current.ontrack = (event) => {
        if (remoteVideo.current && event.streams.length > 0) {
          remoteVideo.current.srcObject = event.streams[0];
        } else if (!event.streams[0]) {
          console.warn(
            "⚠️ No stream available in track event, using track directly",
          );
        }
      };
    } catch (error) {
      console.error(" Error in establishPeer:", error);
    }
  };

  // socket ka control

  useEffect(() => {
    if (!socket) return;

    establishPeer();

    socket?.on(
      "Greeting",
      (data: { message: string; name: string; profile: string }) => {
        alert(data.message);
        console.log("greeting", data);
        serRemoteData(data);
        remoteProfileRef.current = data.profile;
      },
    );

    socket.on("recieveOffer", async (data) => {
      handelRecieveOffer(data);
    });

    socket.on("recieveMessage", async (data) => {
      // read from ref to ensure we use the latest remote profile
      const prof = remoteProfileRef.current;
      console.log("using profile for remote message:", prof);
      SetMessages((prev) => [
        ...prev,
        { message: data, image: prof, sender: "remote" },
      ]);
    });

    // Handle remote ICE candidates from peer
    socket.on("ice-candidate", async (data) => {
      try {
        if (peerConnection.current && data.candidate) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        }
      } catch (error) {
        console.error(" Error adding ICE candidate:", error);
      }
    });

    // Cleanup listeners
    return () => {
      socket.off("Greeting");
      socket.off("recieveOffer");
      socket.off("recieveMessage");
      socket.off("ice-candidate");
    };
  }, [socket]);

  return (
    <>
      {roomId ? (
        <>
          <div className="h-14 px-4 flex items-center justify-between bg-[#313338] border-b border-[#1e1f22] shadow-sm">
            {/* Left section */}
            <div className="flex items-center gap-3">
              <Hash size={20} className="text-gray-400" />

              <div className="flex flex-col leading-tight">
                <span className="text-white font-semibold text-sm">
                  {RemoteData.name}
                </span>
                <span className="text-gray-400 text-xs">Online</span>
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-semibold text-sm">
                Your RoomId:{"   " + roomId}
              </span>
            </div>

            <Avatar className="h-8 w-8">
              <AvatarImage src={remoteProfileRef.current} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
          <Videocomponent
            localVideo={localVideo}
            remoteVideo={remoteVideo}
            messages={messages}
            text={text}
            setText={setText}
            socket={socket}
            roomId={roomId}
            SetMessages={SetMessages}
          />
        </>
      ) : (
        <div className="w-full h-[100vh] bg-slate-900 flex justify-center items-center">
          <span className={"px-6 py-3 rounded-lg  text-gray-200 font-medium"}>
            {inputString}
          </span>

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
