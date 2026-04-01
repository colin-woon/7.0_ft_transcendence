import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
}

interface ChatMessageProps {
  messages: Message[];
  contact: { avatar: string };
  activeContactId: string;
}

export default function ChatMessage({ messages, contact, activeContactId }: ChatMessageProps) {
  return (
    <AnimatePresence initial={false}>
      {messages.map((msg, index) => {
        const isMe = msg.sender === "me";
        const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender === "me");
        return (
          <motion.div
            key={`${activeContactId}-${msg.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${
              index > 0 && messages[index - 1]?.sender === msg.sender ? "mt-0.5" : "mt-3"
            }`}
          >
            {!isMe && (
              <div className="w-7 flex-shrink-0">
                {showAvatar && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                    {contact.avatar}
                  </div>
                )}
              </div>
            )}
            <div
              className={`max-w-[65%] px-4 py-2.5 text-sm leading-relaxed ${
                isMe
                  ? "bg-bubble-me text-bubble-me-fg rounded-2xl rounded-br-md"
                  : "bg-bubble-other text-bubble-other-fg rounded-2xl rounded-bl-md"
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-[10px] mt-1 ${isMe ? "text-bubble-me-fg/60" : "text-muted-foreground"}`}>
                {msg.time}
              </p>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
