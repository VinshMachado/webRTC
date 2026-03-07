import React from "react";

import ChattingComp from "@/app/custom/chattingComp";
import { Button } from "@/components/ui/button";
import UserDetails from "@/Storage/Store";
import { SendHorizonal } from "lucide-react";
import { RefObject, Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
interface MessageSchema {
  message: string;
  image: string;
  sender: string;
}

export interface ChatVideoContext {
  localVideo: React.RefObject<HTMLVideoElement | null>;
  remoteVideo: React.RefObject<HTMLVideoElement | null>;
  messages: MessageSchema[];
  SetMessages: Dispatch<SetStateAction<MessageSchema[]>>;

  text: string;
  setText: Dispatch<SetStateAction<string>>;

  socket: Socket | null;
  roomId: string | null | undefined;
}

const Videocomponent = ({
  localVideo,
  remoteVideo,
  messages,
  text,
  setText,
  socket,
  roomId,
  SetMessages,
}: ChatVideoContext) => {
  const Userdata = UserDetails((state) => state.Userdata);
  return (
    <>
      {" "}
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
                onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && text.trim()) {
                    let prof = Userdata.profile;
                    SetMessages((prev: any) => [
                      ...prev,
                      { message: text, image: prof, sender: "user" },
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
                    let prof = Userdata.profile;
                    SetMessages((prev: any) => [
                      ...prev,
                      { message: text, image: prof, sender: "user" },
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
  );
};

export default Videocomponent;
