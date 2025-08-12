"use client";

import UserSignForm, { userSchemaType } from "@/components/SigninUp";
import { signIn } from "@/services/userService";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Signin() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token =
		typeof window !== "undefined" ? localStorage.getItem("token") : null;
	const redirectTo = searchParams.get("redirect") || "/home";

	useEffect(() => {
		if (token) {
			router.replace(redirectTo);
		}
	}, [token, redirectTo, router]);

	const handleSignIn = async (data: userSchemaType) => {
		try {
			const response = await signIn(data);
			if (response === 200) {
				setTimeout(() => {
					router.replace(redirectTo);
				}, 1000);
			}
		} catch (error) {
			// Error handling is managed by signIn function
			console.error("Signin navigation error", error);
		}
	};

	return (
		<main className="mx-auto max-w-5xl flex flex-col justify-center items-center min-h-screen">
			<UserSignForm type="signin" submit={handleSignIn} />
			<h2 className="dark:text-white text-base font-normal text-gray-900 mt-8">
				Don't have an account?
				<a href="/auth/signup" className="underline pl-1 font-semibold">
					Get started
				</a>
			</h2>
		</main>
	);
}
