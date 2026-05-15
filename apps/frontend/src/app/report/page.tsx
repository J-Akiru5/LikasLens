"use client";

import { useCallback, useEffect, useState } from "react";
import NextImage from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function ReportPage() {
	const [base64Image, setBase64Image] = useState<string>("");
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [toastMessage, setToastMessage] = useState("");
	const [isGhostMode, setIsGhostMode] = useState(false);
	const offlineQueueKey = "likaslens_offline_reports";
	const offlineDbName = "likaslens-offline";
	const offlineStoreName = "report-queue";

	// Dummy test data
	const mockBase64Image =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
	const mockLatitude = 14.5994;
	const mockLongitude = 120.9842;

	/**
	 * Populate the form with safe, dummy values for quick UI testing.
	 */
	const populateWithTestData = () => {
		setBase64Image(mockBase64Image);
		setLatitude(mockLatitude);
		setLongitude(mockLongitude);
	};

	/**
	 * Clear all report fields to reset the form state.
	 */
	const clearForm = () => {
		setBase64Image("");
		setLatitude(null);
		setLongitude(null);
	};

	/**
	 * Strip EXIF by re-encoding the image via canvas (browser-only).
	 */
	const stripExif = async (base64: string) => {
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
				} catch {
					resolve(base64);
				}
			};
			img.onerror = () => resolve(base64);
			img.src = base64;
		});
	};

	/**
	 * Open IndexedDB for offline report storage.
	 */
	const openOfflineDb = useCallback(
		() =>
			new Promise<IDBDatabase>((resolve, reject) => {
				const request = indexedDB.open(offlineDbName, 1);
				request.onupgradeneeded = () => {
					const db = request.result;
					if (!db.objectStoreNames.contains(offlineStoreName)) {
						db.createObjectStore(offlineStoreName, { keyPath: "id" });
					}
				};
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			}),
		[offlineDbName, offlineStoreName]
	);

	/**
	 * Persist a report payload when offline so it can sync later.
	 */
	const queueOfflineReport = async (payload: Record<string, unknown>) => {
		const queuedPayload = { ...payload, queuedAt: new Date().toISOString() };
		try {
			const db = await openOfflineDb();
			const tx = db.transaction(offlineStoreName, "readwrite");
			const store = tx.objectStore(offlineStoreName);
			store.put({ id: crypto.randomUUID(), payload: queuedPayload });
			await new Promise<void>((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
			return;
		} catch {
			const existing = localStorage.getItem(offlineQueueKey);
			const queue = existing ? JSON.parse(existing) : [];
			queue.push(queuedPayload);
			localStorage.setItem(offlineQueueKey, JSON.stringify(queue));
		}
	};

	/**
	 * Flush queued offline reports when connectivity returns.
	 */
	const flushOfflineQueue = useCallback(async () => {
		const laravelUrl =
			process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://127.0.0.1:8000";
		const queued: Array<{ id: string; payload: Record<string, unknown> }> = [];

		try {
			const db = await openOfflineDb();
			const tx = db.transaction(offlineStoreName, "readonly");
			const store = tx.objectStore(offlineStoreName);
			const request = store.getAll();
			const items = await new Promise<Array<{ id: string; payload: Record<string, unknown> }>>(
				(resolve, reject) => {
					request.onsuccess = () => resolve(request.result as Array<{ id: string; payload: Record<string, unknown> }>);
					request.onerror = () => reject(request.error);
				}
			);
			queued.push(...items);
		} catch {
			const existing = localStorage.getItem(offlineQueueKey);
			const items = existing ? JSON.parse(existing) : [];
			queued.push(...items.map((payload: Record<string, unknown>, idx: number) => ({ id: String(idx), payload })));
		}

		if (!queued.length) return;

		const successfulIds: string[] = [];
		for (const item of queued) {
			try {
				const response = await fetch(`${laravelUrl}/api/reports`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(item.payload),
				});
				if (response.ok) successfulIds.push(item.id);
			} catch {
				// keep item queued
			}
		}

		try {
			const db = await openOfflineDb();
			const tx = db.transaction(offlineStoreName, "readwrite");
			const store = tx.objectStore(offlineStoreName);
			successfulIds.forEach((id) => store.delete(id));
			await new Promise<void>((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
		} catch {
			const existing = localStorage.getItem(offlineQueueKey);
			const items = existing ? JSON.parse(existing) : [];
			const remaining = items.filter((_: unknown, idx: number) => !successfulIds.includes(String(idx)));
			localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
		}
	}, [openOfflineDb, offlineQueueKey, offlineStoreName]);

	useEffect(() => {
		const handleOnline = () => {
			void flushOfflineQueue();
		};
		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [flushOfflineQueue]);

	/**
	 * Validate, anonymize, and submit the report to the backend.
	 */
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setToastMessage("");

		try {
			const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";

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

			if (isGhostMode) {
				payload["user_id"] = "ANONYMOUS_GHOST";
			} else if (userId) {
				payload["user_id"] = userId;
			}

			if (!navigator.onLine) {
				await queueOfflineReport(payload);
				setToastMessage(
					"You are offline. Report queued securely and will sync when connection is restored."
				);
				setIsSubmitting(false);
				return;
			}

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
								<NextImage
									src={base64Image}
									alt="Report"
									width={640}
									height={480}
									sizes="(max-width: 768px) 100vw, 640px"
									unoptimized
									className="max-h-full max-w-full rounded object-contain"
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

					<div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-sm font-semibold text-emerald-900">Ghost Mode</p>
								<p className="text-xs text-emerald-700">
									Send report anonymously and mask user identity.
								</p>
							</div>
							<label className="inline-flex items-center gap-2">
								<input
									type="checkbox"
									checked={isGhostMode}
									onChange={(e) => setIsGhostMode(e.target.checked)}
									className="h-5 w-5 accent-emerald-600"
								/>
								<span className="text-sm text-emerald-900">
									{isGhostMode ? "ON" : "OFF"}
								</span>
							</label>
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
									isGhostMode,
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
