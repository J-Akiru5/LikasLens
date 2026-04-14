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
		<main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
			<div className="w-full max-w-md rounded-lg bg-white shadow-lg p-8">
				{/* Header */}
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold text-gray-900">LikasLens</h1>
					<p className="mt-2 text-sm text-gray-600">Civic Reporting Platform</p>
				</div>

				{/* Status Message */}
				{statusMessage && (
					<div
						className={`mb-6 rounded-md p-4 text-sm font-medium ${
							statusType === "error"
								? "bg-red-50 text-red-800 border border-red-200"
								: "bg-green-50 text-green-800 border border-green-200"
						}`}
					>
						{statusMessage}
					</div>
				)}

				{/* Form */}
				<form className="flex flex-col gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Email
						</label>
						<input
							type="email"
							name="email"
							placeholder="your@email.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<input
							type="password"
							name="password"
							placeholder="••••••••"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					{/* Buttons */}
					<div className="flex gap-3 mt-6">
						<button
							type="submit"
							formAction={signIn}
							className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
						>
							Sign In
						</button>

						<button
							type="submit"
							formAction={signUp}
							className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
						>
							Sign Up
						</button>
					</div>
				</form>
			</div>
		</main>
	);
}
