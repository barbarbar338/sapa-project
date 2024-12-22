import { io } from "socket.io-client";

// Socket.io backend server URL
const URL = "http://localhost:3001";

export const socket = io(URL);
