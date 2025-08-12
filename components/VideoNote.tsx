"use client";

type VideoProps = {
	url: string;
};

function getYoutubeId(url: string) {
	try {
		const parsed = new URL(url);
		if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
		if (parsed.searchParams.get("v")) return parsed.searchParams.get("v")!;
		if (parsed.pathname.includes("/embed/"))
			return parsed.pathname.split("/embed/")[1];
		return "";
	} catch {
		return "";
	}
}

export default function VideoNote({ url }: VideoProps) {
	const id = getYoutubeId(url);
	const thumbnailUrl = id
		? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
		: "";

	return (
		<div className="rounded-xl overflow-hidden relative group border">
			{thumbnailUrl ? (
				<a href={url} target="_blank" rel="noreferrer">
					<img
						src={thumbnailUrl}
						alt="YouTube Thumbnail"
						className="w-full object-cover"
					/>
				</a>
			) : (
				<div className="p-4 text-sm text-gray-500">Invalid video URL</div>
			)}
		</div>
	);
}
