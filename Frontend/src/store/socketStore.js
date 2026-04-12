import { create } from "zustand";
import { io } from "socket.io-client";

const BASE_URL =
import.meta.env.VITE_BACKEND_URL || "http://localhost:6550";

export const useSocketStore = create((set, get) => ({
socket: null,

connect: () => {
const existing = get().socket;
if (existing) return; // prevent multiple connections

```
const socket = io(BASE_URL, {
  withCredentials: true,
});

set({ socket });
```

},

emit: (event, data) => {
const socket = get().socket;
if (!socket) return console.log("Socket not connected ❌");

```
socket.emit(event, data);
```

},

on: (event, cb) => {
const socket = get().socket;
if (!socket) return;

```
socket.on(event, cb);
```

},

off: (event) => {
const socket = get().socket;
socket?.off(event);
},
}));
