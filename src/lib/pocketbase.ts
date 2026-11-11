import PocketBase from "pocketbase";
import { BROWSER_POCKETBASE_URL } from "./pocketbase/client";

const pb = new PocketBase(BROWSER_POCKETBASE_URL);

// Optional: Enable auto-cancellation for requests
pb.autoCancellation(false);

export default pb;
