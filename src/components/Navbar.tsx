import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Jobs", to: "/jobs" },
  { label: "Resume Analysis", to: "/resume-analysis" },
  { label: "LinkedIn Analysis", to: "/linkedin-analysis" },
  { label: "Suggested Jobs", to: "/suggested-jobs" },
  { label: "Mock Interviewer", to: "/mock-interviewer" }, // NEW PAGE
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const profile = JSON.parse(localStorage.getItem("userProfile") || '{}');

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-transparent sticky top-0 z-50">
      {/* Hamburger */}
      <div className="relative">
        <button
          className="flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-blue-100 focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open menu"
        >
          <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
          <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
          <span className="block w-7 h-0.5 bg-gray-800 rounded transition-all" />
        </button>
        {menuOpen && (
          <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 hover:bg-blue-50 ${location.pathname === link.to ? 'font-bold text-blue-700' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Only show search bar if on jobs page */}
      {location.pathname === "/jobs" && (
        <input
          type="text"
          placeholder="Search jobs..."
          className="w-96 border rounded px-4 py-2 shadow-sm mx-auto"
          value={jobSearch}
          onChange={e => setJobSearch(e.target.value)}
        />
      )}
      {/* Profile icon */}
      <button
        className="flex items-center gap-2 ml-auto"
        onClick={() => navigate("/profile")}
        aria-label="Profile"
      >
        <img
          src={profile.profilePic || "/placeholder.svg"}
          alt="Profile"
          className="w-10 h-10 rounded-full border object-cover"
        />
        <span className="font-medium text-gray-700 hidden md:inline">{profile.name || "Profile"}</span>
      </button>
    </nav>
  );
};

export default Navbar;
