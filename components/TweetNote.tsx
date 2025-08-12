"use client";
import { Tweet } from "react-tweet";

type TweetProps = { url: string };

function getTweetId(url: string) {
	try {
		const u = new URL(url);
		return u.pathname.split("/").pop() || "";
	} catch {
		return url;
	}
}

export default function TweetNote({ url }: TweetProps) {
	const tweetId = getTweetId(url);
	return (
		<div className="light dark:dark rounded-lg overflow-hidden border">
			<Tweet id={tweetId} />
		</div>
	);
}
