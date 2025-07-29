
  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { onAuthStateChanged } from "firebase/auth";
  import { doc, getDoc } from "firebase/firestore";
  import { auth, db } from "../firebase"; // Ensure to properly import your Firebase app instance

  const EmployerNavbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [employerProfile, setEmployerProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const docRef = doc(db, "Employers", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setEmployerProfile(docSnap.data());
          }
        } else {
          navigate("/login");
        }
      });

      return () => unsubscribe();
    }, [navigate]);

    return (
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow sticky top-0 z-50">
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
              <button
                className="block w-full text-left px-4 py-3 hover:bg-blue-50"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/employer-dashboard");
                }}
              >
                Candidate Dashboard
              </button>
              <button
                className="block w-full text-left px-4 py-3 hover:bg-blue-50"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/upload-job-descriptions");
                }}
              >
                Upload job descriptions
              </button>
              <button
                className="block w-full text-left px-4 py-3 hover:bg-blue-50"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/matches");
                }}
              >
                View Matches
              </button>
              <button
                className="block w-full text-left px-4 py-3 hover:bg-blue-50"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/view-all-uploads");
                }}
              >
                All Uploads
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="font-semibold text-blue-700">
            {employerProfile?.company || "Employer"}
          </div>
          {employerProfile?.profilePic && (
            <button
              className="focus:outline-none"
              onClick={() => {
                setMenuOpen(false);
                setShowProfile(true);
              }}
              aria-label="View Profile"
            >
              <img
                src={employerProfile.profilePic}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 hover:shadow-lg transition"
              />
            </button>
          )}
        </div>
        {showProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
              <div className="flex flex-col items-center gap-4">
                <img
                  src={employerProfile?.profilePic}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                />
                <div className="font-bold text-xl">{employerProfile?.name || "Name"}</div>
                <div className="text-blue-700 text-md">{employerProfile?.company || "Company"}</div>
                <div className="text-gray-600 text-sm">{employerProfile?.role || "Role"}</div>
                <div className="text-gray-500 text-xs">{employerProfile?.email || "Email"}</div>
                <div className="text-gray-500 text-xs">{employerProfile?.phno || "Phone"}</div>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  };

  export default EmployerNavbar;



