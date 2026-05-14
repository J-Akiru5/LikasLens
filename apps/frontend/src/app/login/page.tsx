"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resendConfirmation, signIn, signUp } from "@/app/actions/auth";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const [isLogin, setIsLogin] = useState(() => searchParams.get("mode") === "login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [agreeToUpdates, setAgreeToUpdates] = useState(false);

	const status = useMemo(() => {
		const error = searchParams.get("error");
		const message = searchParams.get("message");

		if (error) {
			return { type: "error" as const, message: error };
		}

		if (message) {
			return { type: "success" as const, message };
		}

		return { type: "" as const, message: "" };
	}, [searchParams]);

	const showResend =
		status.type === "error" && status.message.toLowerCase().includes("email not confirmed");
	const shouldForceLogin =
		showResend || status.message.toLowerCase().includes("confirmation");
	const activeLoginView = shouldForceLogin || isLogin;

	return (
		<main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
			<div className="w-full max-w-4xl">
				<div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12">
						<div className="flex flex-col justify-center">
							{activeLoginView ? (
								<div>
									<h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
									<p className="text-gray-600 mb-6">
										Don&apos;t have an account?{" "}
										<button
											type="button"
											onClick={() => setIsLogin(false)}
											className="text-blue-600 font-semibold hover:underline"
										>
											Sign up here
										</button>
									</p>

									{status.message ? (
										<div
											className={`mb-4 rounded-lg p-4 text-sm font-medium ${
												status.type === "error"
													? "bg-red-50 text-red-800 border border-red-200"
													: "bg-green-50 text-green-800 border border-green-200"
											}`}
										>
											{status.message}
										</div>
									) : null}

									<form className="flex flex-col gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
											<input
												type="email"
												name="email"
												placeholder="Enter your email here"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
											<input
												type="password"
												name="password"
												placeholder="Enter your password here"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												required
											/>
										</div>

										<input type="hidden" name="email" value={email} />

										<button
											type="submit"
											formAction={signIn}
											className="w-32 mx-auto mt-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-800 transition-colors"
										>
											Login
										</button>

										{showResend ? (
											<button
												type="submit"
												formAction={resendConfirmation}
												className="mx-auto text-sm font-semibold text-blue-700 hover:underline"
											>
												Resend confirmation email
											</button>
										) : null}
									</form>
								</div>
							) : (
								<div>
									<h1 className="text-3xl font-bold text-gray-900 mb-2">Sign up</h1>
									<p className="text-gray-600 mb-6">
										Already have account?{" "}
										<button
											type="button"
											onClick={() => setIsLogin(true)}
											className="text-blue-600 font-semibold hover:underline"
										>
											Login here
										</button>
									</p>

									{status.message ? (
										<div
											className={`mb-6 rounded-lg p-4 text-sm font-medium ${
												status.type === "error"
													? "bg-red-50 text-red-800 border border-red-200"
													: "bg-green-50 text-green-800 border border-green-200"
											}`}
										>
											{status.message}
										</div>
									) : null}

									<form className="flex flex-col gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
											<input
												type="text"
												name="name"
												placeholder="Enter your name here"
												value={name}
												onChange={(e) => setName(e.target.value)}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Email Id</label>
											<input
												type="email"
												name="email"
												placeholder="Enter your email here"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												required
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
											<input
												type="password"
												name="password"
												placeholder="Enter your password here"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												required
											/>
										</div>

										<label className="flex items-center gap-3 py-2">
											<input
												type="checkbox"
												name="agreeToUpdates"
												checked={agreeToUpdates}
												onChange={(e) => setAgreeToUpdates(e.target.checked)}
												className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
											/>
											<span className="text-sm text-gray-600">
												By signing up you agree to receive updates and special Offers
											</span>
										</label>

										<button
											type="submit"
											formAction={signUp}
											className="w-32 mx-auto mt-4 px-6 py-3 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-800 transition-colors"
										>
											Submit
										</button>
									</form>
								</div>
							)}
						</div>

						<div className="hidden md:flex flex-col justify-center items-center">
							<div className="text-center">
								<div className="mb-6">
									<div className="text-6xl mb-4">👤📱</div>
									<p className="text-gray-400 text-sm">Illustration</p>
								</div>
								<h2 className="text-2xl font-semibold text-gray-800 mb-2">
									{activeLoginView ? "Welcome Back!" : "Get Started"}
								</h2>
								<p className="text-gray-600">
									{activeLoginView
										? "Login to access your civic reporting dashboard"
										: "Join LikasLens and start reporting environmental issues"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
