// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export GET and POST handlers for UploadThing
export const { GET, POST } = createRouteHandler({
	router: ourFileRouter,
});
