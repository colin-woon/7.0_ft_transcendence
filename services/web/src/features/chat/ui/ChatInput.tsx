import { useState } from "react";
import { Paperclip, Smile, Send } from "lucide-react";
import { motion } from "framer-motion";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;
    onSend();
    setInputValue("");
    onChange("");
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 px-4 pb-4 pt-2 w-full max-w-2xl flex justify-end bg-transparent pointer-events-none">
      <div className="w-full max-w-2xl bg-card border border-border shadow-lg rounded-2xl p-2 flex items-center gap-2 pointer-events-auto">
        <form onSubmit={handleSend} className="flex items-center gap-2 w-full">
          <button type="button" className="p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground text-sm rounded-xl px-4 py-2 border-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2">
              <Smile className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.92 }}
            disabled={!inputValue.trim() || disabled}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
