"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Camera, MapPin, Fingerprint, RefreshCw } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { ToastContainer, showToast } from "@/components/ui/toast";
import { EdgeInterceptorModal } from "@/components/modals/edge-interceptor-modal";

export default function ReportPage() {
	const [base64Image, setBase64Image] = useState<string>("");
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGhostMode, setIsGhostMode] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [showEdgeInterceptor, setShowEdgeInterceptor] = useState(false);
	const [riskIndicators, setRiskIndicators] = useState<string[]>([]);
	const pendingPayloadRef = useRef<Record<string, unknown> | null>(null);
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
					showToast("Could not get GPS location. You can enter coordinates manually.", "info");
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			);
		}
	}, [camera]);

	const clearForm = () => {
		setBase64Image("");
		setLatitude(null);
		setLongitude(null);
		camera.stop();
	};

	const submitReport = async (payload: Record<string, unknown>, ghostRetry = false) => {
		const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";

		if (ghostRetry) {
			payload["user_id"] = undefined;
			delete payload["user_id"];
		}

		if (!navigator.onLine) {
			await queueOfflineReport(payload);
			showToast("You are offline. Report queued securely and will sync when connection is restored.", "info");
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

		return response.json();
	};

	const checkRiskWithAI = async (imageBase64: string): Promise<{ hasConcern: boolean; indicators: string[] }> => {
		try {
			const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8001";
			const response = await fetch(`${aiUrl}/analyze/base64`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image: imageBase64, confidence: 0.25 }),
			});
			if (!response.ok) return { hasConcern: false, indicators: [] };
			const data = await response.json();
			const assessment = data?.analysis?.environmental_assessment;
			const hasConcern = assessment?.has_environmental_concern === true;
			const indicators: string[] = (assessment?.indicators ?? []).map(
				(i: { label: string }) => i.label
			);
			return { hasConcern, indicators };
		} catch {
			return { hasConcern: false, indicators: [] };
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const cleanedImage = await stripExif(base64Image);

			let userId: string | undefined = undefined;
			if (!isGhostMode) {
				try {
					const supabase = createClient();
					const { data: { user } } = await supabase.auth.getUser();
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

			showToast("Analyzing submission...", "loading");

			const { hasConcern, indicators } = await checkRiskWithAI(cleanedImage);
			if (hasConcern) {
				pendingPayloadRef.current = payload;
				setRiskIndicators(indicators);
				setShowEdgeInterceptor(true);
				setIsSubmitting(false);
				return;
			}

			const responseData = await submitReport(payload);
			showToast(responseData?.message || "Report submitted successfully!", "success");
			clearForm();
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : "Error submitting report. Check console.",
				"error"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdgeProceed = async () => {
		setShowEdgeInterceptor(false);
		setRiskIndicators([]);
		const payload = pendingPayloadRef.current;
		if (!payload) return;

		setIsGhostMode(true);
		setIsSubmitting(true);
		try {
			const responseData = await submitReport(payload, true);
			showToast(responseData?.message || "Report submitted anonymously!", "success");
			clearForm();
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : "Error submitting report.",
				"error"
			);
		} finally {
			setIsSubmitting(false);
			pendingPayloadRef.current = null;
		}
	};

	return (
		<>
			<ToastContainer />
			<EdgeInterceptorModal
				isOpen={showEdgeInterceptor}
				onCancel={() => {
					setShowEdgeInterceptor(false);
					setRiskIndicators([]);
					pendingPayloadRef.current = null;
				}}
				onProceed={handleEdgeProceed}
				isLoading={isSubmitting}
				indicators={riskIndicators}
			/>

			<main className={`min-h-screen font-body transition-colors duration-700 ${
				isGhostMode
					? "bg-[#081c15]"
					: "bg-gradient-to-br from-[#1b4332]/10 to-[#2de1c2]/10"
			}`}>
				<div className="max-w-2xl mx-auto p-6">
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

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="brutal-panel panel-surface border-4 border-primary p-8">
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
						</div>

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

						<div className="grid grid-cols-2 gap-4">
							<button
								type="button"
								onClick={clearForm}
								className="brutal-panel px-6 py-3 font-bold uppercase text-sm rounded-lg transition-all border-2 border-accent text-accent hover:bg-accent/5"
							>
								Clear Form
							</button>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
							className={`w-full brutal-button px-8 py-4 font-heading font-black uppercase text-lg rounded-lg transition-all border-2 flex items-center justify-center gap-3 ${
								isSubmitting || !base64Image || latitude === null || longitude === null
									? "border-foreground/30 bg-foreground/10 text-foreground/40 cursor-not-allowed"
									: "border-primary bg-primary text-background hover:shadow-[6px_6px_0px_#1b4332]"
							}`}
						>
							{isSubmitting ? (
								<>
									<RefreshCw className="w-5 h-5 animate-spin" />
									Submitting...
								</>
							) : (
								"Submit Report"
							)}
						</button>
					</form>
				</div>
			</main>

			<canvas ref={canvasRef} className="hidden" aria-hidden="true" />
		</>
	);
}
