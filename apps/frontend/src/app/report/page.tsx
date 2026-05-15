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
	const [toastTone, setToastTone] = useState<"success" | "error" | "info">("info");
	const [isGhostMode, setIsGhostMode] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
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
			setIsOnline(true);
			void flushOfflineQueue();
			setToastTone("success");
			setToastMessage("Connection restored. Syncing queued reports.");
		};
		const handleOffline = () => {
			setIsOnline(false);
			setToastTone("error");
			setToastMessage("Connection lost. Reports will queue until you are back online.");
		};
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		setIsOnline(navigator.onLine);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [flushOfflineQueue]);

	/**
	 * Validate, anonymize, and submit the report to the backend.
	 */
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setToastMessage("");
		setToastTone("info");

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

			if (!isGhostMode && userId) {
				payload["user_id"] = userId;
			}

			if (!navigator.onLine) {
				await queueOfflineReport(payload);
				setToastMessage(
					"You are offline. Report queued securely and will sync when connection is restored."
				);
				setToastTone("info");
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
			setToastMessage(responseData.message || "Report submitted successfully!");
			setToastTone("success");
			clearForm();
		} catch (error) {
			setToastMessage(
				error instanceof Error ? `Error: ${error.message}` : "Error submitting report. Check console and CORS."
			);
			setToastTone("error");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-[#081C15] via-[#1B4332] to-[#081C15] flex items-center justify-center p-4">
			<div className="w-full max-w-2xl">
				<div className="bg-[#F8F9FA] rounded-3xl shadow-2xl overflow-hidden p-8 border-2 border-[#1B4332]/15">
					<h1 className="text-3xl font-bold text-[#081C15] mb-2">Report Environmental Issue</h1>
					<p className="text-[#1B4332]/80 mb-6">
						Help us protect the environment by reporting violations in your area.
					</p>

					<div className="mb-6 flex items-center justify-between rounded-lg border border-[#1B4332]/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4332]">
						<span>Connection</span>
						<span
							className={
								isOnline
									? "rounded-full border border-[#2DE1C2] px-2 py-1 text-[#081C15]"
									: "rounded-full border border-[#FFB703] px-2 py-1 text-[#081C15]"
							}
						>
							{isOnline ? "Online" : "Offline"}
						</span>
					</div>

					{toastMessage && (
						<div
							className={`mb-6 rounded-lg p-4 text-sm font-medium border ${
								toastTone === "error"
									? "bg-[#FFB703]/10 text-[#081C15] border-[#FFB703]"
									: toastTone === "success"
									? "bg-[#2DE1C2]/10 text-[#081C15] border-[#2DE1C2]"
									: "bg-[#F8F9FA] text-[#1B4332] border-[#1B4332]/20"
							}`}
						>
							{toastMessage}
						</div>
					)}

					{/* Image Preview */}
					<div className="mb-8 p-6 bg-white rounded-lg border border-[#1B4332]/15">
						<h2 className="text-lg font-semibold text-[#081C15] mb-4">📷 Image Preview</h2>
						<div className="h-40 bg-[#F8F9FA] border-2 border-dashed border-[#1B4332]/25 rounded-lg flex items-center justify-center overflow-auto">
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
								<p className="text-[#1B4332]/60 text-center">No image yet</p>
							)}
						</div>
							<p className="text-xs text-[#1B4332]/70 mt-2">
							Base64 Length: <strong>{base64Image.length} characters</strong>
						</p>
					</div>

					{/* GPS Coordinates */}
						<div className="mb-8 p-6 bg-white rounded-lg border border-[#1B4332]/15">
							<h2 className="text-lg font-semibold text-[#081C15] mb-4">📍 GPS Coordinates</h2>
						<div className="grid grid-cols-2 gap-4">
								<div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#1B4332]/15">
									<p className="text-sm font-medium text-[#1B4332]/80 mb-1">Latitude</p>
									<p className="text-xl font-bold text-[#1B4332]">
									{latitude ?? "Not set"}
								</p>
							</div>
								<div className="bg-[#F8F9FA] p-4 rounded-lg border border-[#1B4332]/15">
									<p className="text-sm font-medium text-[#1B4332]/80 mb-1">Longitude</p>
									<p className="text-xl font-bold text-[#1B4332]">
									{longitude ?? "Not set"}
								</p>
							</div>
						</div>
					</div>

						<div className="mb-6 rounded-lg border border-[#2DE1C2]/40 bg-[#2DE1C2]/10 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
									<p className="text-sm font-semibold text-[#081C15]">Ghost Mode</p>
									<p className="text-xs text-[#1B4332]/80">
									Send report anonymously and mask user identity.
								</p>
							</div>
							<label className="inline-flex items-center gap-2">
								<input
									type="checkbox"
									checked={isGhostMode}
									onChange={(e) => setIsGhostMode(e.target.checked)}
										className="h-5 w-5 accent-[#2DE1C2]"
								/>
									<span className="text-sm text-[#081C15]">
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
								className="px-4 py-3 bg-[#2DE1C2] text-[#081C15] font-semibold rounded-lg hover:bg-[#28cbb0] transition-colors"
							>
								✓ Test Data
							</button>
							<button
								type="button"
								onClick={clearForm}
								className="px-4 py-3 bg-[#FFB703] text-[#081C15] font-semibold rounded-lg hover:bg-[#e6a503] transition-colors"
							>
								✕ Clear Form
							</button>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
							className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors ${
								isSubmitting || !base64Image || latitude === null || longitude === null
									? "bg-[#1B4332]/40 text-[#F8F9FA] cursor-not-allowed"
									: "bg-[#1B4332] text-[#F8F9FA] hover:bg-[#163b2b]"
							}`}
						>
							<span className="inline-flex items-center justify-center gap-2">
								{isSubmitting && (
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								)}
								{isSubmitting
									? "Sending to LGU..."
									: !isOnline
									? "Queue Offline"
									: "Submit Report"}
							</span>
						</button>
					</form>

					{/* Debug Info */}
					<div className="mt-8 p-4 bg-[#F8F9FA] rounded-lg border border-[#1B4332]/15">
						<h3 className="text-sm font-semibold text-[#081C15] mb-2">Debug Info</h3>
						<pre className="text-xs bg-white p-3 rounded border border-[#1B4332]/15 overflow-auto max-h-40 text-[#081C15]">
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
						<p className="text-xs text-[#1B4332]/80 mt-2">
							<strong>Env Check:</strong> Set <code className="bg-white px-2 py-1 rounded">NEXT_PUBLIC_LARAVEL_API_URL</code> in .env.local
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
