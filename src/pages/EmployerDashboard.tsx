import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const mockCandidates = [
	{
		name: "Alice Smith",
		tagline: "Full Stack Developer",
		description: "React, Node.js, AWS",
		profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
	},
	{
		name: "Bob Johnson",
		tagline: "Data Scientist",
		description: "Python, ML, Data Analysis",
		profilePic: "https://randomuser.me/api/portraits/men/46.jpg",
	},
	{
		name: "Carol Lee",
		tagline: "UI/UX Designer",
		description: "Figma, Adobe XD, Prototyping",
		profilePic: "https://randomuser.me/api/portraits/women/47.jpg",
	},
];

const EmployerDashboard = () => {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [candidates, setCandidates] = useState(mockCandidates);

	// Redirect to login if not authenticated as employer
	useEffect(() => {
		const isAuthenticated = localStorage.getItem("isAuthenticated");
		const userType = localStorage.getItem("userType");
		if (isAuthenticated !== "true" || userType !== "employer") {
			navigate("/login");
		}
		setCandidates(mockCandidates);
	}, [navigate]);

	const filtered = search
		? candidates.filter(
				(c) =>
					c.description.toLowerCase().includes(search.toLowerCase()) ||
					c.name.toLowerCase().includes(search.toLowerCase()) ||
					c.tagline.toLowerCase().includes(search.toLowerCase())
			)
		: candidates;

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20">
			<div className="flex">
				<div className="flex-1">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-8">
						{filtered.length === 0 ? (
							<div className="col-span-full text-center text-gray-500">
								No candidates found.
							</div>
						) : (
							filtered.map((c, i) => (
								<div
									key={i}
									className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
								>
									<img
										src={c.profilePic}
										alt={c.name}
										className="w-20 h-20 rounded-full mb-2 object-cover"
									/>
									<div className="font-bold text-lg">{c.name}</div>
									<div className="text-blue-700 text-sm mb-1">
										{c.tagline}
									</div>
									<div className="text-gray-600 text-xs text-center">
										{c.description}
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmployerDashboard;
