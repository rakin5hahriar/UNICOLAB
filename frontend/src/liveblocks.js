import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Create a Liveblocks client
const client = createClient({
  publicApiKey: process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_123", // Replace with your public key
  throttle: 16, // Update frequency in ms
});

// Create a room context for React components
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useObject,
  useMap,
  useList,
  useBatch,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMutation,
} = createRoomContext(client); 