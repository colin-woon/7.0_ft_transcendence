import { Message } from '../models/types'

export function handleSendMessage(
  text: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
) {
  const now = new Date()
  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
  const newMessage: Message = {
    id: Date.now().toString(),
    text,
    own: true,
    time: timeString,
    status: 'sent',
  }
  setMessages((prev) => [...prev, newMessage])
  // Simulate reply after a delay
  setIsTyping(true)
  setTimeout(() => {
    setIsTyping(false)
    const replyTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    setMessages((prev) => [
      ...prev.map((m) =>
        m.own
          ? {
              ...m,
              status: 'read' as const,
            }
          : m,
      ),
      {
        id: (Date.now() + 1).toString(),
        text: 'That sounds great! Let me check on my end and get back to you shortly.',
        own: false,
        time: replyTime,
      },
    ])
  }, 2500)
}
