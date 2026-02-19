"use client";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { Hash } from "lucide-react";
import { AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar } from "@/components/ui/avatar";
import UserDetails from "@/Storage/Store";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import ChattingComp from "@/app/custom/chattingComp";
import { SendHorizonal } from "lucide-react";
import Videocomponent from "../Createmeeting/videocomponent";
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
  const [socket, setSocket] = useState<any | null>(null);

  const Userdata = UserDetails((state) => state.Userdata);

  const [roomId, setRoomid] = useState<string | null>();
  const [inputString, setInputString] = useState<string | null>();

  const [messages, SetMessages] = useState<MessageSchema[]>([]);
  //chating textThing
  const [text, setText] = useState("");
  const [RemoteData, setRemoteData] = useState<{
    name: string;
    profile: string;
  }>({
    name: "nubie",
    profile:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS36J6t0SbHUeuuQ0nq2j9ki507M79Pu-oT6g&s",
  });

  const remoteNameRef = useRef<string>("nubie");
  const remoteProfileRef = useRef<string>(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS36J6t0SbHUeuuQ0nq2j9ki507M79Pu-oT6g&s",
  );

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
    try {
      const tempRoom = inputString;
      console.log("📍 Joining room:", tempRoom);

      await socket?.emit("join-room", {
        id: tempRoom,
        name: Userdata.name,
        profile: Userdata.profile,
      });

      // Create peer connection
      peerConnection.current = new RTCPeerConnection(configuration);
      console.log("✅ Peer connection created");

      // SET UP ICE CANDIDATE HANDLER FIRST (before getting camera)
      peerConnection.current.onicecandidate = (event) => {
        console.log("🟡 ICE candidate event:", event.candidate);
        if (event.candidate) {
          socket?.emit("ice-candidate", {
            Room: tempRoom,
            candidate: event.candidate,
          });
          console.log("📤 Sent ICE candidate:", event.candidate);
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

      // NOW get camera
      await GetCamera();
      console.log("✅ Camera stream acquired");

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      console.log("✅ Offer created:", offer);

      await peerConnection.current.setLocalDescription(
        new RTCSessionDescription(offer),
      );
      console.log("✅ Local description set (offer)");

      const Room = inputString;
      await socket?.emit("offer", { Room, offer });
      console.log("📤 Offer sent to room:", Room);
    } catch (error) {
      console.error("❌ Error in join_room:", error);
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
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    console.log(socket);

    socket?.on("Greeting", async (message: string) => {
      alert(message);
    });

    socket.on("recieveMessage", async (data: string) => {
      const prof = remoteProfileRef.current;
      SetMessages((prev) => [
        ...prev,
        { message: data, image: prof, sender: "remote" },
      ]);
    });

    socket?.on(
      "recieveAnswer",
      async (data: { Room: string; answer: any; Userdata: any }) => {
        try {
          console.log("📨 Received answer:", data.answer);

          // update ref so recieveMessage uses the latest profile
          if (data.Userdata && data.Userdata.profile) {
            remoteProfileRef.current = data.Userdata.profile;
            remoteNameRef.current = data.Userdata.name;
            setRemoteData({
              name: data.Userdata.name,
              profile: data.Userdata.profile,
            });
          }
          await peerConnection.current?.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );
        } catch (error) {
          console.error(" Error setting remote description:", error);
        }
      },
    );

    // Handle remote ICE candidates
    socket?.on("ice-candidate", async (data: any) => {
      try {
        console.log("📨 Received ICE candidate from peer:", data.candidate);
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
      socket.off("recieveAnswer");
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

            {/* Right section avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={RemoteData.profile} />
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
