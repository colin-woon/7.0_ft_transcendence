export interface Message {
  id: string;
  text: string;
  own: boolean;
  time: string;
  status?: "sent" | "read";
}

export interface User {
  name: string;
  initials: string;
  online: boolean;
}
