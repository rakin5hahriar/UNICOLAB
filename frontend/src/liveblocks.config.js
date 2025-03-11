import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: "pk_dev_ohg1aNAYcHooZ47JxKoAvRXJVoFo66gjHWo7lEs8jl_d3sVPAo9fk2NruUEepBf4",
  throttle: 100,
});

// Define presence and storage as empty objects
// The actual properties will be set in the RoomProvider
export const Presence = {};
export const Storage = {};
export const UserMeta = {};
export const RoomEvent = {};

export const {
  suspense: {
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
    useErrorListener,
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
  },
} = createRoomContext(client, {
  async resolveUsers({ userIds }) {
    // In a real app, you would fetch user data from your database
    return userIds.map(id => ({
      name: `User ${id.substring(0, 5)}`,
      avatar: `https://ui-avatars.com/api/?name=User+${id.substring(0, 5)}&background=random`,
      color: `#${id.substring(0, 6)}`,
    }));
  },
  async resolveMentionSuggestions({ text, roomId }) {
    // In a real app, you would fetch users from your database
    return [];
  },
}); 