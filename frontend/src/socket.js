import { io } from "socket.io-client";
import { BASE_URL, getToken } from "./api/client.js";

const socket = io(BASE_URL, {
  transports: ["websocket", "polling"],
  autoConnect: false,
  auth: (cb) => {
    cb({ token: getToken() });
  },
});

export function connectSocket() {
  if (!getToken()) {
    return;
  }
  if (!socket.connected) {
    socket.auth = { token: getToken() };
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;
