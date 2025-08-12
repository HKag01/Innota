"use client"; // Required for interactivity in Next.js App Router

import { useState } from "react";
import { Menu, X, Brain } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HeaderWelcome() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const router = useRouter();

	const navigateLogin = () => {
		router.push("/auth/signin");
	};

	const menuItems = [
		{ href: "#home", label: "Home" },
		{ href: "#features", label: "Features" },
		{ href: "#pricing", label: "Pricing" },
		{ href: "#about", label: "About" },
	];

	return (
		<div className="sticky top-0 z-50 bg-neutral-900 shadow-md transition-shadow duration-300">
			<div className="flex justify-between items-center py-4 max-w-7xl mx-auto px-4 md:px-8">
				{/* Logo */}
				<Link
					href="#home"
					className="text-white text-2xl font-bold flex items-center gap-3"
				>
					<Brain className="stroke-indigo-500 size-7" />
					Innota
				</Link>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden text-gray-300 hover:text-gray-400"
					onClick={() => setIsMenuOpen((prev) => !prev)}
				>
					{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>

				{/* Desktop Navigation */}
				<div className="hidden md:flex text-gray-300 text-base gap-12 items-center">
					{menuItems.map((item) => (
						<Link
							key={item.label}
							href={item.href}
							className="hover:text-gray-400"
						>
							{item.label}
						</Link>
					))}
					<button
						className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 px-4 py-2 rounded-md text-white"
						onClick={navigateLogin}
					>
						Get Started
					</button>
				</div>

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<div className="absolute top-full left-0 right-0 bg-neutral-900 border-t border-neutral-800 md:hidden">
						<div className="flex flex-col items-center py-4 space-y-4">
							{menuItems.map((item) => (
								<Link
									key={item.label}
									href={item.href}
									className="text-gray-300 hover:text-gray-400"
									onClick={() => setIsMenuOpen(false)}
								>
									{item.label}
								</Link>
							))}
							<button
								className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 px-4 py-2 rounded-md w-40 text-white"
								onClick={() => {
									setIsMenuOpen(false);
									navigateLogin();
								}}
							>
								Get Started
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
