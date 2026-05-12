"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ReportPage() {
	const [base64Image, setBase64Image] = useState<string>("");
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [toastMessage, setToastMessage] = useState("");
	const [isGhostMode, setIsGhostMode] = useState(false);

	// Dummy test data
	const mockBase64Image =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
	const mockLatitude = 14.5994;
	const mockLongitude = 120.9842;

	const populateWithTestData = () => {
		setBase64Image(mockBase64Image);
		setLatitude(mockLatitude);
		setLongitude(mockLongitude);
	};

	const clearForm = () => {
		setBase64Image("");
		setLatitude(null);
		setLongitude(null);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setToastMessage("");

		try {
			const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";

			// Strip EXIF by re-encoding the image via canvas (works for JPEG/PNG in browser)
			async function stripExif(base64: string) {
				if (!base64) return base64;
				return await new Promise<string>((resolve) => {
					const img = new Image();
					img.crossOrigin = "anonymous";
					img.onload = () => {
						try {
							const canvas = document.createElement("canvas");
							canvas.width = img.naturalWidth || img.width;
							canvas.height = img.naturalHeight || img.height;
							const ctx = canvas.getContext("2d");
							if (!ctx) return resolve(base64);
							ctx.drawImage(img, 0, 0);
							const cleaned = canvas.toDataURL();
							resolve(cleaned);
						} catch (err) {
							resolve(base64);
						}
					};
					img.onerror = () => resolve(base64);
					img.src = base64;
				});
			}

			const cleanedImage = await stripExif(base64Image);

			// Try to fetch Supabase user id unless Ghost Mode is enabled
			let userId: string | undefined = undefined;
			if (!isGhostMode) {
				try {
					const supabase = createClient();
					const {
						data: { user },
					} = await supabase.auth.getUser();
					userId = user?.id;
				} catch {
					// ignore, continue anonymously if not available
				}
			}

			const payload: Record<string, unknown> = {
				base64Image: cleanedImage,
				latitude,
				longitude,
			};

			if (userId && !isGhostMode) payload["user_id"] = userId;

			const response = await fetch(`${laravelUrl}/api/reports`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}

			const responseData = await response.json();
			setToastMessage(responseData.message || "Report Submitted Successfully!");
			clearForm();
		} catch (error) {
			console.error("Error submitting report:", error);
			setToastMessage(
				error instanceof Error ? `Error: ${error.message}` : "Error submitting report. Check console and CORS."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
			<div className="w-full max-w-2xl">
				<div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Report Environmental Issue</h1>
					<p className="text-gray-600 mb-6">
						Help us protect the environment by reporting violations in your area.
					</p>

					{toastMessage && (
						<div
							className={`mb-6 rounded-lg p-4 text-sm font-medium ${
								toastMessage.toLowerCase().includes("error")
									? "bg-red-50 text-red-800 border border-red-200"
									: "bg-green-50 text-green-800 border border-green-200"
							}`}
						>
							{toastMessage}
						</div>
					)}

					{/* Image Preview */}
					<div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
						<h2 className="text-lg font-semibold text-gray-800 mb-4">📷 Image Preview</h2>
						<div className="h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-auto">
							{base64Image ? (
								<img
									src={base64Image}
									alt="Report"
									className="max-h-full max-w-full rounded"
								/>
							) : (
								<p className="text-gray-400 text-center">No image yet</p>
							)}
						</div>
						<p className="text-xs text-gray-500 mt-2">
							Base64 Length: <strong>{base64Image.length} characters</strong>
						</p>
					</div>

					{/* GPS Coordinates */}
					<div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
						<h2 className="text-lg font-semibold text-gray-800 mb-4">📍 GPS Coordinates</h2>
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-white p-4 rounded-lg border border-gray-200">
								<p className="text-sm font-medium text-gray-600 mb-1">Latitude</p>
								<p className="text-xl font-bold text-green-700">
									{latitude ?? "Not set"}
								</p>
							</div>
							<div className="bg-white p-4 rounded-lg border border-gray-200">
								<p className="text-sm font-medium text-gray-600 mb-1">Longitude</p>
								<p className="text-xl font-bold text-green-700">
									{longitude ?? "Not set"}
								</p>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<button
								type="button"
								onClick={populateWithTestData}
								className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
							>
								✓ Test Data
							</button>
							<button
								type="button"
								onClick={clearForm}
								className="px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
							>
								✕ Clear Form
							</button>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
							className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors ${
								isSubmitting || !base64Image || latitude === null || longitude === null
									? "bg-gray-400 text-white cursor-not-allowed"
									: "bg-green-700 text-white hover:bg-green-800"
							}`}
						>
							{isSubmitting ? "⏳ Sending to LGU..." : "🚀 Submit Report"}
						</button>
					</form>

					{/* Debug Info */}
					<div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<h3 className="text-sm font-semibold text-blue-900 mb-2">Debug Info</h3>
						<pre className="text-xs bg-white p-3 rounded border border-blue-200 overflow-auto max-h-40 text-gray-700">
							{JSON.stringify(
								{
									base64ImageLength: base64Image.length,
									latitude,
									longitude,
									isSubmitting,
									laravelUrl: process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000",
									toastMessage,
								},
								null,
								2
							)}
						</pre>
						<p className="text-xs text-blue-700 mt-2">
							<strong>Env Check:</strong> Set <code className="bg-white px-2 py-1 rounded">NEXT_PUBLIC_LARAVEL_API_URL</code> in .env.local
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
