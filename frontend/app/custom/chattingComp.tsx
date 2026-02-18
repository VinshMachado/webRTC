import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleAction,
} from "@/components/ui/chat-bubble";
import { Copy, RefreshCcw } from "lucide-react";

interface MessageSchema {
  message: string;
  image: string;
  sender: string;
}
interface Props {
  messages: MessageSchema[];
}
export default function ChattingComp(messages: Props) {
  return (
    <div className="max-w-md space-y-4 p-4">
      {messages.messages.map((data) =>
        data.sender == "user" ? (
          <>
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                fallback="AI"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
              />
              <ChatBubbleMessage>{data.message}</ChatBubbleMessage>
            </ChatBubble>
          </>
        ) : (
          <>
            <ChatBubble variant="sent">
              <ChatBubbleAvatar
                fallback="US"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
              />
              <ChatBubbleMessage variant="sent">
                {data.message}
              </ChatBubbleMessage>
            </ChatBubble>
          </>
        ),
      )}
    </div>
  );
}
