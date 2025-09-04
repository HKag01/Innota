"use client";

import { File, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

type DocumentProps = {
	filename: string;
	url: string;
	thumbnail?: string;
	status?: string;
};

export default function DocumentNote({ filename, url, thumbnail, status }: DocumentProps) {
	// Status indicator component
	const StatusIndicator = () => {
		switch (status) {
			case "PENDING":
				return (
					<div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
						<Clock size={12} />
						<span>Processing</span>
					</div>
				);
			case "PROCESSING":
				return (
					<div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
						<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
						<span>Processing</span>
					</div>
				);
			case "COMPLETED":
				return (
					<div className="flex items-center gap-1 text-green-600 dark:text-green-400">
						<CheckCircle size={12} />
						<span>Ready</span>
					</div>
				);
			case "FAILED":
				return (
					<div className="flex items-center gap-1 text-red-600 dark:text-red-400">
						<XCircle size={12} />
						<span>Failed</span>
					</div>
				);
			default:
				return (
					<div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
						<File size={12} />
						<span>Document</span>
					</div>
				);
		}
	};

	return (
		<div className="rounded-2xl group relative border border-gray-300 dark:border-none dark:bg-neutral-900 bg-gray-50 overflow-hidden">
			{/* Thumbnail or placeholder */}
			<div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
				{thumbnail && status === "COMPLETED" && thumbnail.length > 1000 ? (
					<img
						src={thumbnail}
						alt={`${filename} thumbnail`}
						className="w-full h-full object-cover"
						onError={(e) => {
							// Fallback if thumbnail fails to load
							console.warn('Thumbnail failed to load for:', filename);
							e.currentTarget.style.display = 'none';
							e.currentTarget.nextElementSibling?.classList.remove('hidden');
						}}
					/>
				) : null}
				
				{/* Fallback placeholder */}
				<div className={`${thumbnail && status === "COMPLETED" ? 'hidden' : 'flex'} w-full h-full items-center justify-center flex-col text-gray-400 dark:text-gray-500`}>
					<File size={48} className="mb-2" />
					<span className="text-sm font-medium">
						{status === "PENDING" || status === "PROCESSING" ? "Processing..." : "PDF Document"}
					</span>
				</div>

				{/* Processing overlay */}
				{(status === "PENDING" || status === "PROCESSING") && (
					<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
						<div className="text-white text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
							<span className="text-sm">Generating thumbnail...</span>
						</div>
					</div>
				)}
			</div>

			{/* Status indicator */}
			<div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 text-xs font-medium shadow-sm">
				<StatusIndicator />
			</div>

			{/* Title */}
			<div className="p-4">
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="flex gap-2 items-start hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
				>
					<File className="size-4 mt-0.5 flex-shrink-0" />
					<span className="font-semibold text-sm leading-tight dark:text-gray-300" style={{
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden'
					}}>
						{filename}
					</span>
				</a>
			</div>
		</div>
	);
}
