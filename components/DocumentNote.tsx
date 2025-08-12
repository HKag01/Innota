"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { File } from "lucide-react";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

type DocumentProps = {
	filename: string;
	url: string;
};

export default function DocumentNote({ filename, url }: DocumentProps) {
	return (
		<div className="rounded-2xl group relative border border-gray-300 dark:border-none dark:bg-neutral-900 bg-gray-50 px-6 pb-4">
			{/* PDF preview */}
			<Document file={url}>
				<Page pageNumber={1} width={260} />
			</Document>

			{/* Top-right tag */}
			<div className="bg-gray-200 dark:bg-gray-800 absolute top-0 right-0 text-gray-600 dark:text-gray-400 flex items-center gap-1 text-xs font-medium px-2 rounded-3xl py-1 mt-2 mr-2">
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1"
				>
					<File size={12} />
					Document
				</a>
			</div>

			{/* Title */}
			<div className="pt-3 font-semibold truncate dark:text-gray-300">
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="flex gap-1 items-center"
				>
					<File className="size-4" />
					{filename}
				</a>
			</div>
		</div>
	);
}
