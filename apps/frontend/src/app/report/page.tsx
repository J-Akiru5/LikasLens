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
				`${process.env.NEXT_PUBLIC_LARAVEL_API_URL}/api/reports`,
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
		<main>
			<div>
				<h1>Report Submission Form</h1>

				{toastMessage && (
					<div style={{ padding: "10px", margin: "10px 0", border: "1px solid #ccc", backgroundColor: toastMessage.includes("Error") ? "#ffe6e6" : "#e6ffe6" }}>
						{toastMessage}
					</div>
				)}

				<div>
					<h2>Image State</h2>
					<div>
						{base64Image ? <img src={base64Image} alt="Report" style={{ maxWidth: "200px" }} /> : <p>No image</p>}
					</div>
					<p>Base64 Length: {base64Image.length} chars</p>
				</div>

				<div>
					<h2>GPS Coordinates</h2>
					<div>
						<p>Latitude: {latitude ?? "Not set"}</p>
						<p>Longitude: {longitude ?? "Not set"}</p>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<div>
						<button type="button" onClick={populateWithTestData}>
							Populate with Test Data
						</button>
						<button type="button" onClick={clearForm}>
							Clear Form
						</button>
					</div>

					<div style={{ marginTop: "20px" }}>
						<button
							type="submit"
							disabled={isSubmitting || !base64Image || latitude === null || longitude === null}
							style={{
								padding: "10px 20px",
								backgroundColor: isSubmitting ? "#ccc" : "#007bff",
								color: "white",
								border: "none",
								cursor: isSubmitting ? "not-allowed" : "pointer",
							}}
						>
							{isSubmitting ? "Sending to LGU..." : "Submit Report"}
						</button>
					</div>
				</form>

				<div>
					<h2>Form Data (Debug)</h2>
					<pre>
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
