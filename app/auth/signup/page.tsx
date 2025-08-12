"use client";

import UserSignForm, { userSchemaType } from "@/components/SigninUp";
import { signUp } from "@/services/userService";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
	const router = useRouter();
	const token =
		typeof window !== "undefined" ? localStorage.getItem("token") : null;

	useEffect(() => {
		if (token) {
			router.push("/home");
		}
	}, [token, router]);

	const handleSignUp = async (data: userSchemaType) => {
		try {
			const response = await signUp(data);
			if (response === 200) {
				setTimeout(() => {
					router.push("/home");
				}, 1000);
			}
		} catch (error) {
			console.error("Signup error", error);
		}
	};

	return (
		<main className="mx-auto max-w-5xl flex flex-col justify-center min-h-screen items-center">
			<UserSignForm type="signup" submit={handleSignUp} />
			<h2 className="dark:text-white text-base font-normal text-gray-900 mt-8">
				Already a member?
				<a href="/auth/signin" className="underline pl-1 font-semibold">
					Log in
				</a>
			</h2>
		</main>
	);
}
