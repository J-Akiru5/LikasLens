"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Camera, MapPin, Fingerprint, Activity, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCamera } from "@/hooks/useCamera";
import { ToastContainer, showToast } from "@likaslens/shared";
import { EdgeInterceptorModal } from "@/components/modals/edge-interceptor-modal";

export default function ReportPage() {
	const [base64Image, setBase64Image] = useState<string>("");
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGhostMode, setIsGhostMode] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isTriaging, setIsTriaging] = useState(false);
	const [triageIndicators, setTriageIndicators] = useState<string[]>([]);
	const [showManualCoords, setShowManualCoords] = useState(false);
	const [manualLat, setManualLat] = useState("");
	const [manualLng, setManualLng] = useState("");

	const offlineQueueKey = "likaslens_offline_reports";
	const offlineDbName = "likaslens-offline";
	const offlineStoreName = "report-queue";

	const camera = useCamera("environment");
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !camera.stream) return;
		video.srcObject = camera.stream;
		video.play().catch(() => {});
	}, [camera.stream]);

	// Sync local Ghost Mode with global theme
	useEffect(() => {
		const themeValue = isGhostMode ? "ghost" : "civic";
		document.documentElement.setAttribute("data-theme", themeValue);
	}, [isGhostMode]);

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

	const flushOfflineQueue = useCallback(async () => {
		const laravelUrl =
			process.env.NEXT_PUBLIC_API_URL || "";
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
			showToast("Connection restored. Syncing queued reports.", "success");
		};
		const handleOffline = () => {
			setIsOnline(false);
			showToast("Connection lost. Reports will queue until you are back online.", "error");
		};
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		setIsOnline(navigator.onLine);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [flushOfflineQueue]);

	const capturePhoto = useCallback(() => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas) return;
		if (video.videoWidth === 0 || video.videoHeight === 0) return;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
		setBase64Image(dataUrl);
		camera.stop();

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setLatitude(position.coords.latitude);
					setLongitude(position.coords.longitude);
				},
				() => {
					setShowManualCoords(true);
					showToast("Could not get GPS location. Enter coordinates manually below.", "info");
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			);
		} else {
			setShowManualCoords(true);
		}
	}, [camera]);

	const clearForm = () => {
		setBase64Image("");
		setLatitude(null);
		setLongitude(null);
		setShowManualCoords(false);
		setManualLat("");
		setManualLng("");
		setTriageIndicators([]);
		setIsModalOpen(false);
		camera.stop();
	};

	const finalizeSubmission = async (cleanedImage: string) => {
		const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";
		
		let userId: string | undefined = undefined;
		if (!isGhostMode) {
			try {
				const supabase = createClient();
				const {
					data: { user },
				} = await supabase.auth.getUser();
				userId = user?.id;
			} catch {
				// continue anonymously
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
			showToast("You are offline. Report queued securely.", "info");
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
		showToast(responseData.message || "Report submitted successfully!", "success");
		clearForm();
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!base64Image) {
			showToast("Please capture a photo first.", "error");
			return;
		}
		
		setIsSubmitting(true);
		const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";

		try {
			const cleanedImage = isGhostMode ? await stripExif(base64Image) : base64Image;

			// Triage Pre-check if NOT already in Ghost Mode
			if (!isGhostMode && navigator.onLine) {
				setIsTriaging(true);
				try {
					const triageRes = await fetch(`${laravelUrl}/api/reports/triage`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ base64Image: cleanedImage }),
					});
					if (triageRes.ok) {
						const triageData = await triageRes.json();
						if (triageData.has_concern) {
							setTriageIndicators(triageData.indicators.map((i: { label?: string; type?: string }) => i.label || i.type));
							setIsModalOpen(true);
							setIsSubmitting(false);
							setIsTriaging(false);
							return; // Intercept submission
						}
					}
				} catch (err) {
					console.error("Triage pre-check failed:", err);
				} finally {
					setIsTriaging(false);
				}
			}

			await finalizeSubmission(cleanedImage);
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : "Error submitting report. Check console.",
				"error"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<ToastContainer />
			<EdgeInterceptorModal 
				isOpen={isModalOpen}
				isLoading={isSubmitting}
				indicators={triageIndicators}
				onCancel={() => setIsModalOpen(false)}
				onProceed={async () => {
					setIsGhostMode(true);
					setIsSubmitting(true);
					const cleaned = await stripExif(base64Image);
					await finalizeSubmission(cleaned);
					setIsModalOpen(false);
				}}
			/>
			
			<main className={`min-h-screen font-body transition-all duration-700 ${
				isGhostMode 
					? "bg-[#081c15]" 
					: "bg-gradient-to-br from-[#1b4332]/10 to-[#2de1c2]/10"
			}`}>
				<div className="max-w-2xl mx-auto p-4 sm:p-6">
					{/* Back Navigation */}
					<Link
						href="/"
						className="inline-flex items-center gap-2 mb-6 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors font-mono text-sm font-bold uppercase tracking-wider"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Home
					</Link>

					{/* Header */}
					<div className="mb-8">
						<div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary mb-4 bg-background/50 rounded">
							<span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
							<span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
								Report an Issue
							</span>
						</div>
						<h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-primary mb-2">
							Document the Problem
						</h1>
						<p className="text-base sm:text-lg text-foreground/80 font-semibold">
							Your evidence helps protect our earth. Every photo, every detail counts.
						</p>
					</div>

					{/* Offline indicator */}
					{!isOnline && (
						<div className="mb-4 p-3 border-2 border-accent bg-accent/10 text-accent font-mono text-xs font-bold rounded flex items-center gap-2">
							<span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
							Offline — reports will queue until connection returns.
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Image Preview */}
						<motion.div 
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							className="brutal-panel panel-surface border-4 border-primary p-4 sm:p-8"
						>
							<div className="flex items-center gap-3 mb-6">
								<Camera className="w-6 h-6 text-secondary" />
								<h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">
									Evidence Photo
								</h2>
							</div>

							{base64Image ? (
								<div className="bionic-frame p-6 bg-background/40 backdrop-blur-md border-2 border-primary rounded-lg">
									<NextImage
										src={base64Image}
										alt="Report Evidence"
										width={800}
										height={600}
										className="max-h-64 w-full object-contain rounded"
									/>
								</div>
							) : camera.isActive ? (
								<div className="relative bionic-frame bg-black/80 border-2 border-primary rounded-lg overflow-hidden">
									<video
										ref={videoRef}
										autoPlay
										playsInline
										muted
										className="w-full h-64 object-cover"
									/>
									<div className="absolute inset-0 border-2 border-secondary/50 pointer-events-none rounded" />
									<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
										<button
											type="button"
											onClick={capturePhoto}
											className="brutal-button px-6 py-3 font-bold uppercase text-sm rounded-lg flex items-center gap-2 shadow-[4px_4px_0px_#1b4332]"
										>
											<Camera className="w-5 h-5" />
											Capture
										</button>
										<button
											type="button"
											onClick={() => camera.stop()}
											className="px-4 py-3 font-bold uppercase text-sm rounded-lg border-2 border-accent text-accent bg-background/80 hover:bg-accent/10 transition-colors"
										>
											Cancel
										</button>
									</div>
								</div>
							) : (
								<div className="bionic-frame p-6 bg-background/40 backdrop-blur-md border-2 border-primary rounded-lg h-48 flex items-center justify-center">
									<div className="text-center">
										<Camera className="w-12 h-12 text-primary/40 mx-auto mb-2" />
										<p className="text-primary/60 font-mono text-sm mb-4">No image captured yet</p>
										<button
											type="button"
											onClick={() => camera.start()}
											disabled={camera.isLoading}
											className="brutal-button px-6 py-3 font-bold uppercase text-sm rounded-lg inline-flex items-center gap-2 shadow-[4px_4px_0px_#1b4332] disabled:opacity-50"
										>
											{camera.isLoading ? (
												<>
													<RefreshCw className="w-5 h-5 animate-spin" />
													Opening Camera...
												</>
											) : (
												<>
													<Camera className="w-5 h-5" />
													Capture Photo
												</>
											)}
										</button>
										{camera.error && (
											<p className="text-accent font-mono text-xs mt-3">
												{camera.errorMessage}
											</p>
										)}
									</div>
								</div>
							)}
						</motion.div>

						{/* GPS Coordinates */}
						<motion.div 
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className="brutal-panel panel-surface border-4 border-primary p-4 sm:p-8"
						>
							<div className="flex items-center gap-3 mb-6">
								<MapPin className="w-6 h-6 text-secondary" />
								<h2 className="font-heading text-2xl font-black uppercase tracking-tight text-primary">
									Location Data
								</h2>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="bionic-frame p-4 border-2 border-primary bg-background/50 rounded">
									<p className="text-xs font-mono font-bold text-primary/70 uppercase mb-2">Latitude</p>
									<p className="text-2xl font-mono font-bold text-primary">
										{latitude?.toFixed(6) ?? "—"}
									</p>
									{showManualCoords && (
										<input
											type="number"
											step="any"
											placeholder="e.g. 11.7053"
											value={manualLat}
											onChange={(e) => {
												setManualLat(e.target.value);
												const val = parseFloat(e.target.value);
												if (!isNaN(val) && val >= -90 && val <= 90) setLatitude(val);
											}}
											className="w-full mt-2 brutal-panel theme-input px-3 py-2 rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
										/>
									)}
								</div>
								<div className="bionic-frame p-4 border-2 border-primary bg-background/50 rounded">
									<p className="text-xs font-mono font-bold text-primary/70 uppercase mb-2">Longitude</p>
									<p className="text-2xl font-mono font-bold text-primary">
										{longitude?.toFixed(6) ?? "—"}
									</p>
									{showManualCoords && (
										<input
											type="number"
											step="any"
											placeholder="e.g. 122.2970"
											value={manualLng}
											onChange={(e) => {
												setManualLng(e.target.value);
												const val = parseFloat(e.target.value);
												if (!isNaN(val) && val >= -180 && val <= 180) setLongitude(val);
											}}
											className="w-full mt-2 brutal-panel theme-input px-3 py-2 rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
										/>
									)}
								</div>
							</div>
							{!showManualCoords && (
								<button
									type="button"
									onClick={() => setShowManualCoords(true)}
									className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-secondary hover:underline"
								>
									Enter coordinates manually
								</button>
							)}
						</motion.div>

						{/* Ghost Mode Toggle */}
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className={`brutal-panel border-4 p-4 sm:p-8 transition-colors duration-500 ${
								isGhostMode 
									? "border-accent bg-[#081c15]/80 shadow-[8px_8px_0px_#ffb703]" 
									: "panel-surface border-primary shadow-[8px_8px_0px_#1b4332]"
							}`}
						>
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
								<label className="inline-flex items-center" aria-label="Toggle Ghost Mode">
									<input
										type="checkbox"
										checked={isGhostMode}
										onChange={(e) => setIsGhostMode(e.target.checked)}
										className="w-6 h-6 rounded border-2 cursor-pointer"
										style={{ 
											borderColor: isGhostMode ? "#ffb703" : "#1b4332",
											accentColor: isGhostMode ? "#ffb703" : "#1b4332"
										}}
									/>
								</label>
							</div>
						</motion.div>

						<div className="grid grid-cols-2 gap-4">
							<button
								type="button"
								onClick={clearForm}
								className="brutal-panel px-6 py-3 font-bold uppercase text-sm rounded-lg transition-all border-2 border-accent text-accent hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
							>
								Clear Form
							</button>
							<button
								type="submit"
								disabled={isSubmitting || isTriaging || !base64Image || latitude === null || longitude === null}
								className={`brutal-button px-6 py-3 font-heading font-black uppercase text-lg rounded-lg transition-all border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
									isSubmitting || isTriaging || !base64Image || latitude === null || longitude === null
										? "border-foreground/30 bg-foreground/10 text-foreground/40 cursor-not-allowed"
										: "border-primary bg-primary text-background hover:shadow-[6px_6px_0px_#1b4332]"
								}`}
							>
								{isSubmitting ? "⏳ Submitting..." : isTriaging ? "🧠 Analyzing..." : "🚀 Submit Report"}
							</button>
						</div>
					</form>
				</div>
			</main>
			<canvas ref={canvasRef} className="hidden" aria-hidden="true" />
		</>
	);
}
