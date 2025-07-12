import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simulated uploaded jobs for demo
const mockUploads = [
	{
		id: 1,
		companyLogo: "https://randomuser.me/api/portraits/men/46.jpg", // Replace with actual logo
		role: "Data Scientist",
		priority: "High",
	},
	{
		id: 2,
		companyLogo: "https://randomuser.me/api/portraits/women/44.jpg",
		role: "AI Engineer",
		priority: "Medium",
	},
	{
		id: 3,
		companyLogo: "https://randomuser.me/api/portraits/men/47.jpg",
		role: "Electrical Engineer",
		priority: "Low",
	},
];

const ViewAllUploads = () => {
	const [uploads, setUploads] = useState([]);
	useEffect(() => {
		// TODO: Fetch uploads for logged in employer from backend
		setUploads(mockUploads);
	}, []);
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 flex flex-col items-center">
			<Card className="w-full max-w-4xl p-8">
				<CardHeader>
					<CardTitle>All Uploaded Job Descriptions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
						{uploads.map((job) => (
							<div
								key={job.id}
								className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center"
							>
								<img
									src={job.companyLogo}
									alt="Company Logo"
									className="w-20 h-20 rounded-full mb-4 object-cover"
								/>
								<div className="font-bold text-lg text-center mb-2">
									{job.role}
								</div>
								<div
									className={`text-sm font-semibold text-center ${
										job.priority === "High"
											? "text-red-600"
											: job.priority === "Medium"
											? "text-yellow-600"
											: "text-green-600"
									}`}
								>
									{job.priority} Priority
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ViewAllUploads;
