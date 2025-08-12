"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

import AddContent from "@/components/AddContent";
import AllNotes, { Memory } from "@/components/AllNotes";
import Greeting from "@/components/Greeting";
import Header from "@/components/Header";
import ScrollBottom from "@/components/Scrollbottom";
import SearchBar from "@/components/SearchBar";
import UserModal from "@/components/UserModal";
import { deleteContent } from "@/services/contentService";

export default function HomePage() {
	const [modalOpen, setModalOpen] = useState(false);
	const [userModalOpen, setUserModalOpen] = useState(false);
	const [memories, setMemories] = useState<Memory[]>([]);
	const router = useRouter();

	// Close modals
	const handleCloseAddContent = () => setModalOpen(false);
	const handleCloseUserModal = () => setUserModalOpen(false);

	// Fetch notes from backend
	const fetchNotes = async () => {
		try {
			const res = await axios.get<{ content: Memory[] }>(
				`/api/v1/content`, // Next.js relative API route or backend URL
				{
					headers: {
						authorization: localStorage.getItem("token") || "",
					},
				}
			);

			setMemories(res.data.content);
			console.log("Fetched all notes:", res.data);
		} catch (err) {
			console.error("Error fetching memories", err);
		}
	};

	// Delete note handler
	const handleDelete = async (id: string) => {
		try {
			await deleteContent(id);
			setMemories((prev) => prev.filter((m) => m._id !== id));
			toast.success("Deleted Memory", { duration: 2000 });
		} catch (err) {
			console.error("Error deleting note", err);
		}
	};

	// On mount → check auth & fetch notes
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/auth/signin");
		} else {
			fetchNotes();
		}
	}, []);

	return (
		<main className="py-24 dark:bg-grid-white/[0.05] bg-grid-black/[0.03] relative">
			{/* Background mask */}
			<div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_85%,black)]"></div>

			<div className="pt-2 max-w-7xl mx-auto min-h-screen flex flex-col justify-between">
				{/* Header */}
				<Header
					setModalState={setModalOpen}
					modalState={modalOpen}
					userModalState={userModalOpen}
					setUserModalState={setUserModalOpen}
				/>

				{/* User Modal */}
				{userModalOpen && (
					<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
						<div className="relative w-full max-w-[2000px] mx-auto">
							<div className="absolute top-4 right-4 max-w-md max-h-[90vh] overflow-auto">
								<UserModal onClose={handleCloseUserModal} />
							</div>
						</div>
					</div>
				)}

				{/* Greeting + Search */}
				<div className="px-4 sm:px-8">
					<Greeting />
					<SearchBar />
				</div>

				{/* Scroll bottom button */}
				<div className="self-center mb-32">
					<ScrollBottom />
				</div>
			</div>

			{/* Notes list */}
			<AllNotes
				memories={memories}
				handledelete={handleDelete}
				modalState={modalOpen}
				setModalState={setModalOpen}
			/>

			{/* Add Content modal */}
			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="relative w-full max-w-md max-h-[90vh] overflow-auto">
						<AddContent
							onClose={handleCloseAddContent}
							refreshNotes={fetchNotes}
						/>
					</div>
				</div>
			)}
		</main>
	);
}
