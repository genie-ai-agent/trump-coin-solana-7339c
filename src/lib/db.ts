import { createClient } from "@neondatabase/neon-js";

export const db = createClient({
  auth: {
    url: "https://ep-soft-sun-b82v1avc.neonauth.c-14.us-east-1.aws.neon.tech/neondb/auth",
    allowAnonymous: true,
  },
  dataApi: {
    url: "https://ep-soft-sun-b82v1avc.apirest.c-14.us-east-1.aws.neon.tech/neondb/rest/v1",
  },
});
