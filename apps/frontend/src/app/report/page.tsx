"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Camera, MapPin, Fingerprint, AlertCircle } from "lucide-react";

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
	const openOfflineDb = () =>
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
		});

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
	const flushOfflineQueue = async () => {
		const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL="http://127.0.0.1:8000";
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
	};

	useEffect(() => {
		const handleOnline = () => {
			void flushOfflineQueue();
		};
		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, []);

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
		<main className={`min-h-screen font-body transition-colors duration-700 ${
			isGhostMode 
				? "bg-[#081c15]" 
				: "bg-gradient-to-br from-[#1b4332]/10 to-[#2de1c2]/10"
		}`}>
			<div className="max-w-2xl mx-auto p-6">
				{/* Header */}
				<div className="mb-8">
					<div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary mb-4 bg-background/50 rounded">
						<span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
						<span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
							Report an Issue
						</span>
					</div>
					<h1 className="font-heading text-5xl md:text-6xl font-black uppercase tracking-tight text-primary mb-2">
						Document the Problem
					</h1>
					<p className="text-lg text-foreground/80 font-semibold">
						Your evidence helps protect our earth. Every photo, every detail counts.
					</p>
				</div>

				{/* Toast Messages */}
				{toastMessage && (
					<div className={`mb-6 p-4 border-2 font-mono text-sm font-bold rounded ${
						toastMessage.toLowerCase().includes("error")
							? "border-accent bg-accent/10 text-accent"
							: "border-secondary bg-secondary/10 text-secondary"
					}`}>
						{toastMessage}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Image Preview */}
					<div className="brutal-panel panel-surface border-4 border-primary p-8">
						<div className="flex items-center gap-3 mb-6">
							<Camera className="w-6 h-6 text-secondary" />
							<h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">
								Evidence Photo
							</h2>
						</div>
						<div className="bionic-frame p-6 bg-background/40 backdrop-blur-md border-2 border-primary rounded-lg h-48 flex items-center justify-center overflow-auto">
							{base64Image ? (
								<img
									src={base64Image}
									alt="Report Evidence"
									className="max-h-full max-w-full rounded"
								/>
							) : (
								<div className="text-center">
									<Camera className="w-12 h-12 text-primary/40 mx-auto mb-2" />
									<p className="text-primary/60 font-mono text-sm">No image captured yet</p>
								</div>
							)}
						</div>
						<p className="text-xs font-mono text-foreground/60 mt-3 uppercase tracking-widest">
							Base64 Size: <strong>{(base64Image.length / 1024).toFixed(2)} KB</strong>
						</p>
					</div>

					{/* GPS Coordinates */}
					<div className="brutal-panel panel-surface border-4 border-primary p-8">
						<div className="flex items-center gap-3 mb-6">
							<MapPin className="w-6 h-6 text-secondary" />
							<h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">
								Location Data
							</h2>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="bionic-frame p-4 border-2 border-primary bg-background/50 rounded">
								<p className="text-xs font-mono font-bold text-primary/70 uppercase mb-2">Latitude</p>
								<p className="text-2xl font-mono font-bold text-primary">
									{latitude?.toFixed(6) ?? "—"}
								</p>
							</div>
							<div className="bionic-frame p-4 border-2 border-primary bg-background/50 rounded">
								<p className="text-xs font-mono font-bold text-primary/70 uppercase mb-2">Longitude</p>
								<p className="text-2xl font-mono font-bold text-primary">
									{longitude?.toFixed(6) ?? "—"}
								</p>
							</div>
						</div>
					</div>

					{/* Ghost Mode Toggle */}
					<div className={`brutal-panel border-4 p-8 transition-colors duration-500 ${
						isGhostMode
							? "border-accent bg-[#081c15]/80 shadow-[8px_8px_0px_#ffb703]"
							: "panel-surface border-primary shadow-[8px_8px_0px_#1b4332]"
					}`}>
						<div className="flex items-center justify-between gap-6">
							<div className="flex items-center gap-3">
								<Fingerprint className={`w-6 h-6 ${isGhostMode ? "text-accent" : "text-primary"}`} />
								<div>
									<p className={`font-heading text-xl font-black uppercase tracking-tight ${
										isGhostMode ? "text-accent" : "text-primary"
									}`}>
										Ghost Mode
									</p>
									<p className={`text-sm font-semibold ${isGhostMode ? "text-white/80" : "text-foreground/70"}`}>
										Send anonymously. Remove all identifying data.
									</p>
								</div>
							</div>
							<label className="inline-flex items-center">
								<input
									type="checkbox"
									checked={isGhostMode}
									onChange={(e) => setIsGhostMode(e.target.checked)}
									className="w-6 h-6 rounded border-2 cursor-pointer"
									style={{
										borderColor: isGhostMode ? "#ffb703" : "#1b4332",
										accentColor: isGhostMode ? "#ffb703" : "#1b4332",
									}}
								/>
							</label>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="grid grid-cols-2 gap-4">
						<button
							type="button"
							onClick={populateWithTestData}
							className="brutal-button px-6 py-3 font-bold uppercase text-sm rounded-lg transition-all border-2 border-primary bg-primary text-background hover:shadow-[4px_4px_0px_#1b4332]"
						>
							Load Test Data
						</button>
						<button
							type="button"
							onClick={clearForm}
							className="brutal-panel px-6 py-3 font-bold uppercase text-sm rounded-lg transition-all border-2 border-accent text-accent hover:bg-accent/5"
						>
							Clear Form
						</button>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
						className={`w-full brutal-button px-8 py-4 font-heading font-black uppercase text-lg rounded-lg transition-all border-2 ${
							isSubmitting || !base64Image || latitude === null || longitude === null
								? "border-foreground/30 bg-foreground/10 text-foreground/40 cursor-not-allowed"
								: "border-primary bg-primary text-background hover:shadow-[6px_6px_0px_#1b4332]"
						}`}
					>
						{isSubmitting ? "⏳ Submitting..." : "🚀 Submit Report"}
					</button>
				</form>

				{/* Debug Panel (for development) */}
				{process.env.NODE_ENV === "development" && (
					<div className="mt-8 brutal-panel panel-surface border-2 border-primary/20 p-4">
						<h3 className="text-xs font-mono font-bold text-primary/60 uppercase mb-2">Debug Info</h3>
						<pre className="text-xs bg-background/50 p-3 rounded border border-primary/20 overflow-auto max-h-40 font-mono text-foreground/70">
							{JSON.stringify(
								{
									imageLength: base64Image.length,
									latitude,
									longitude,
									isSubmitting,
									isGhostMode,
									laravelUrl: process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000",
								},
								null,
								2
							)}
						</pre>
					</div>
				)}
			</div>
		</main>
	);
}
