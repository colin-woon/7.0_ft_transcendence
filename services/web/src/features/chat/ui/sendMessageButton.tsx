'use client';

import { sendMessage } from '../api/chat-services';
import { useChat } from '../models';

export function SendMessageButton() {
  const { tempCurrentUserId } = useChat();

  const handleSend = () => {
    if (!tempCurrentUserId) return;

    void sendMessage('63cbd063-0887-4534-b97b-578095b2e0d5', tempCurrentUserId, 2, {
      content: 'Hello!',
    });
  };

  return (
    <button type="button" className="btn btn-primary" onClick={handleSend} disabled={!tempCurrentUserId}>
      Send Message
    </button>
  );
}
