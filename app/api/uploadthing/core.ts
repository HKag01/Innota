import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
	pdfUploader: f({ pdf: { maxFileSize: "16MB" } }).onUploadComplete(
		async ({ file, metadata }) => {
			console.log("Uploaded file URL:", file.url);
			// TODO: Save file to DB if you need to associate it with a user/content
		}
	),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
