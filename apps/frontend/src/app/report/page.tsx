"use client";

import { useState } from "react";

export default function ReportPage() {
	const [base64Image, setBase64Image] = useState<string>("");
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

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
			const payload = {
				base64Image,
				latitude,
				longitude,
			};

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/reports`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			setToastMessage("Report Submitted!");
			clearForm();
		} catch (error) {
			console.error("Error submitting report:", error);
			setToastMessage("Error submitting report.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
			<div style={{ backgroundColor: "#f9f9f9", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
				<h1 style={{ marginBottom: "20px", color: "#333" }}>Report Submission Form</h1>

				{toastMessage && (
					<div style={{ 
						padding: "15px", 
						margin: "20px 0", 
						border: "2px solid", 
						borderRadius: "6px",
						backgroundColor: toastMessage.includes("Error") ? "#ffe6e6" : "#e6ffe6",
						borderColor: toastMessage.includes("Error") ? "#ff6b6b" : "#51cf66",
						color: toastMessage.includes("Error") ? "#c92a2a" : "#2f9e44",
						fontWeight: "bold"
					}}>
						{toastMessage}
					</div>
				)}

				<div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #ddd" }}>
					<h2 style={{ marginTop: "0", color: "#555" }}>📷 Image State</h2>
					<div style={{ padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "4px", textAlign: "center" }}>
						{base64Image ? <img src={base64Image} alt="Report" style={{ maxWidth: "200px", borderRadius: "4px" }} /> : <p style={{ color: "#999" }}>No image yet</p>}
					</div>
					<p style={{ marginTop: "10px", color: "#666" }}>Base64 Length: <strong>{base64Image.length} chars</strong></p>
				</div>

				<div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #ddd" }}>
					<h2 style={{ marginTop: "0", color: "#555" }}>📍 GPS Coordinates</h2>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
						<p style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
							<strong>Latitude:</strong><br />
							<span style={{ fontSize: "18px", color: "#007bff" }}>{latitude ?? "Not set"}</span>
						</p>
						<p style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
							<strong>Longitude:</strong><br />
							<span style={{ fontSize: "18px", color: "#007bff" }}>{longitude ?? "Not set"}</span>
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
						<button 
							type="button" 
							onClick={populateWithTestData}
							style={{
								padding: "12px 24px",
								backgroundColor: "#28a745",
								color: "white",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								fontWeight: "bold",
								fontSize: "14px",
								transition: "background-color 0.2s"
							}}
							onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#218838"}
							onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#28a745"}
						>
							✓ Populate with Test Data
						</button>
						<button 
							type="button" 
							onClick={clearForm}
							style={{
								padding: "12px 24px",
								backgroundColor: "#dc3545",
								color: "white",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								fontWeight: "bold",
								fontSize: "14px",
								transition: "background-color 0.2s"
							}}
							onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
							onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
						>
							✕ Clear Form
						</button>
					</div>

					<div style={{ marginBottom: "30px" }}>
						<button
							type="submit"
							disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
							style={{
								width: "100%",
								padding: "16px",
								backgroundColor: isSubmitting ? "#ccc" : "#007bff",
								color: "white",
								border: "none",
								borderRadius: "6px",
								cursor: isSubmitting ? "not-allowed" : "pointer",
								fontWeight: "bold",
								fontSize: "16px",
								transition: "background-color 0.2s"
							}}
							onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#0056b3")}
							onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#007bff")}
						>
							{isSubmitting ? "⏳ Sending to LGU..." : "🚀 Submit Report"}
						</button>
					</div>
				</form>

				<div style={{ padding: "15px", backgroundColor: "#e8f4f8", borderRadius: "6px", border: "1px solid #b3e5fc" }}>
					<h2 style={{ marginTop: "0", color: "#00838f", fontSize: "14px" }}>Debug Info</h2>
					<pre style={{ 
						backgroundColor: "#fff", 
						padding: "10px", 
						borderRadius: "4px", 
						overflow: "auto",
						fontSize: "12px",
						border: "1px solid #b3e5fc"
					}}>
						{JSON.stringify(
							{
								base64ImageLength: base64Image.length,
								latitude,
								longitude,
								isSubmitting,
								toastMessage,
							},
							null,
							2
						)}
					</pre>
				</div>
			</div>
		</main>
	);
}
