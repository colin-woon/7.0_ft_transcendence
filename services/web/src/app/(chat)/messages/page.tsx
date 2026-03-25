"use client";
import { useState } from "react";
import ChatSidebar from "@/features/chat/ui/ChatSidebar";
import ChatArea from "@/features/chat/ui/ChatArea";

export default function Index() {
  const [activeContactId, setActiveContactId] = useState("1");

  return (
    // <div className="flex flex-1 h-[calc(100vh-0px)] min-h-0 relative">
      <ChatSidebar activeContactId={activeContactId} onSelectContact={setActiveContactId} />
      // {/* <div className="flex-1 flex flex-col min-h-0">
      // <ChatArea activeContactId={activeContactId} />
      // {/* </div> */}
    // </div>
  );
}