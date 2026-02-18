"use client";
import React, { useEffect } from "react";
import { useRef, useState } from "react";

import UserDetails from "@/Storage/Store";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import ChattingComp from "@/app/custom/chattingComp";
import { SendHorizonal } from "lucide-react";
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

    socket.on("recieveMessage", async (data) => {
      alert(data);
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

          <div className="flex justify-center bg-gray-950 w-full h-auto p-5  items-start p-5 flex flex-wrap">
            <div className="h-[800px] w-auto flex justify-center items-center  flex-col">
              <video
                ref={localVideo}
                className="w-[100%] h-[50vh] sm:w-[90%] sm:h-[50%] rounded-xl sm:m-1"
                autoPlay
              ></video>

              <video
                ref={remoteVideo}
                className="w-[100%] h-[50vh] sm:w-[90%] sm:h-[50%] rounded-xl sm:m-1 "
                autoPlay
                playsInline
                muted={false}
              ></video>
            </div>
            <div className="bg-gray-800 sm:ml-10 h-[80vh] sm:mt-5  w-[800px] md:w-[50%] text-white rounded-xl flex flex-col justify-end">
              <ChattingComp messages={messages} />
              <div className="p-4 bg-[#313338] border-t border-[#1e1f22] rounded-sm">
                <div className="flex items-center gap-3 bg-[#383a40] rounded-xl px-4 py-2 shadow-inner ">
                  {/* Input */}
                  <input
                    placeholder="Message #general"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                    }}
                    onKeyDown={async (
                      e: React.KeyboardEvent<HTMLInputElement>,
                    ) => {
                      if (e.key === "Enter" && text.trim()) {
                        SetMessages((prev) => [
                          ...prev,
                          { message: text, image: "sadasd", sender: "local" },
                        ]);

                        await socket?.emit("sendMessage", { roomId, text });
                        setText("");
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-400 focus:outline-none"
                  />

                  {/* Send Button */}
                  <Button
                    className="bg-[#5865F2] hover:bg-[#4752c4] rounded-lg px-3 h-9"
                    onClick={async () => {
                      if (text.trim()) {
                        SetMessages((prev) => [
                          ...prev,
                          { message: text, image: "sadasd", sender: "local" },
                        ]);
                        await socket?.emit("sendMessage", { roomId, text });
                        setText("");
                      }
                    }}
                  >
                    <SendHorizonal size={18} />
                  </Button>
                </div>
              </div>
            </div>
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
