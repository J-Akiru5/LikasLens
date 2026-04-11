"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { signIn, signUp } from "@/app/actions/auth";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [statusMessage, setStatusMessage] = useState("");
	const [statusType, setStatusType] = useState<"success" | "error" | "">("");

	useEffect(() => {
		const error = searchParams.get("error");
		const message = searchParams.get("message");

		if (error) {
			setStatusType("error");
			setStatusMessage(error);
			return;
		}

		if (message) {
			setStatusType("success");
			setStatusMessage(message);
			return;
		}

		setStatusType("");
		setStatusMessage("");
	}, [searchParams]);

	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-sm border border-gray-300 p-6">
				<h1 className="mb-4 text-xl font-semibold">Login</h1>

				{statusMessage ? (
					<p
						className={`mb-4 border p-2 text-sm ${
							statusType === "error"
								? "border-red-300 text-red-700"
								: "border-green-300 text-green-700"
						}`}
					>
						{statusMessage}
					</p>
				) : null}

				<form className="flex flex-col gap-3">
					<input
						type="email"
						name="email"
						placeholder="Email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="border border-gray-300 px-3 py-2 text-base"
						required
					/>

					<input
						type="password"
						name="password"
						placeholder="Password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="border border-gray-300 px-3 py-2 text-base"
						required
					/>

					<button
						type="submit"
						formAction={signIn}
						className="border border-gray-300 px-3 py-2 text-base"
					>
						Sign in
					</button>

					<button
						type="submit"
						formAction={signUp}
						className="border border-gray-300 px-3 py-2 text-base"
					>
						Sign up
					</button>
				</form>
			</div>
		</main>
	);
}
