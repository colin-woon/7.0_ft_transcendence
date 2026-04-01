'use client';

import { sendMessage } from '../api/chat-services';
import { useCurrentChatSession } from '../models';
// import { useEffect } from 'react';

export function SendMessageButton() {
  const userSession = useCurrentChatSession();

  return (
        <button className="btn btn-primary" onClick={() => sendMessage("63cbd063-0887-4534-b97b-578095b2e0d5", 1, 2, { content: "Hello!"})}>Send Message</button>
  );
}
