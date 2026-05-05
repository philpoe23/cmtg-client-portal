import PocketBase from "pocketbase";

const pb = new PocketBase("http://db.cmcs.local");

// Optional: Enable auto-cancellation for requests
pb.autoCancellation(false);

export default pb;
