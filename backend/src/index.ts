import { createApp } from "./app";
import { scheduled } from "./jobs";

const app = createApp();

export default {
  fetch: app.fetch,
  scheduled,
};
