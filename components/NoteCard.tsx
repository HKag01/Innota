import dynamic from "next/dynamic";

const LinkNote = dynamic(() => import("./LinkNote"), { ssr: false });
const VideoNote = dynamic(() => import("./VideoNote"), { ssr: false });
const TweetNote = dynamic(() => import("./TweetNote"), { ssr: false });
const TextNote = dynamic(() => import("./TextNote"), { ssr: false });
const DocumentNote = dynamic(() => import("./DocumentNote"), { ssr: false });

import { contentType } from "./contentTypes";

export const defaultImageUrl =
	"https://images.unsplash.com/photo-1732454827988-95972d793f1b?q=80&w=1618&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

type NoteProps = {
	id: string;
	type: contentType;
	title: string;
	description: string;
	url: string;
	imageUrl?: string;
	tags?: string[];
	className?: string;
	handledelete?: () => void;
};

export default function Note2({
	id,
	type,
	title,
	description,
	imageUrl,
	url,
}: NoteProps) {
	return (
		<div className="">
			{type === "link" && (
				<LinkNote
					id={id}
					url={url}
					title={title}
					description={description}
					imageUrl={imageUrl}
				/>
			)}
			{type === "video" && <VideoNote url={url} />}
			{type === "tweet" && <TweetNote url={url} />}
			{type === "note" && <TextNote description={description} />}
			{type === "document" && <DocumentNote filename={title} url={url} />}
		</div>
	);
}
