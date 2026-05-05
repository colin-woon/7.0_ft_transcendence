'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send } from 'lucide-react';
import { ChatId, FriendId } from '@/features/chat/models';
import { useAllChatSessions, useAllFriendshipStatuses } from '@/features/chat/models/chat-hooks';
import { sendMessageRequest } from '@/features/chat/api/chat-services';
import toast from 'react-hot-toast';

interface DirectMessageButtonProps {
  chatId?: ChatId;
  targetUserId: FriendId;
  className?: string;
}

export function DirectMessageButton({ chatId, targetUserId, className = "" }: DirectMessageButtonProps) {
  const router = useRouter();
  const { allChatSessions, currentUserId } = useAllChatSessions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("Hi, nice to meet you! Let's chat?");
  const [isSending, setIsSending] = useState(false);
  const statuses = useAllFriendshipStatuses()
  const status = statuses[targetUserId]?.status || 'none'

  // Link priority: 1. Passed chatId 2. Found chatId 3. Open Modal
  const existingChatId = useMemo(() => {
    if (chatId) return chatId;
    if (!targetUserId || !currentUserId) return null;
    
    return Object.values(allChatSessions).find(session => 
      session.type === 'direct' && 
      session.memberIds.includes(targetUserId) &&
      session.memberIds.includes(currentUserId)
    )?.chatId || null;
  }, [chatId, targetUserId, allChatSessions, currentUserId]);

  const handleClick = (e: React.MouseEvent) => {
    if (existingChatId) {
      router.push(`/messages/${existingChatId}`);
      return;
    }
    if (targetUserId) {
      setIsModalOpen(true);
    }
  };

  const handleSendRequest = async () => {
    if (!targetUserId || !message.trim()) return;
    try {
      setIsSending(true);
      await sendMessageRequest(targetUserId, { content: message.trim() });
      setIsModalOpen(false);
      // Backend creates room + message. Refresh inbox to see new DM room.
      router.refresh(); 
    } catch (err : any) {
      const status = err?.status;
      if (status === 409) {
        toast.error("Message request already sent. Please wait for them to respond.");
      } else if (status === 413) {
        toast.error("Message is too large to send.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (status === 'blocked') {
    return null;
  }

  return (
    <>
      <button 
        onClick={handleClick}
        className={`btn btn-circle btn-sm btn-ghost bg-base-200 border border-base-300 text-base-content hover:bg-base-300 tooltip ${className}`}
        data-tip="Message"
      >
        <MessageSquare size={16} />
      </button>

      {/* Intro Message Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Send Message Request</h3>
            <p className="py-4 text-sm text-base-content/70">
              You haven't chatted with this user yet. Send an introduction to start a conversation.
            </p>
            <textarea 
              className="textarea textarea-bordered w-full h-24 focus:ring-2 focus:ring-primary"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
            />
            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                className={`btn btn-primary gap-2 ${isSending ? 'loading' : ''}`}
                onClick={handleSendRequest}
                disabled={isSending || !message.trim()}
              >
                {!isSending && <Send size={16} />}
                Send Request
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </>
  );
}