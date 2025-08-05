// import React, { useEffect, useState, useRef } from "react";
// import { getAuth, onAuthStateChanged, User } from "firebase/auth";
// import { db } from "@/firebase";
// import { collection, getDocs } from "firebase/firestore";
// import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

// const LinkedinAnalysis: React.FC = () => {
//   const [htmlContent, setHtmlContent] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string>("");
//   const [user, setUser] = useState<User | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Handle Firebase Authentication
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(getAuth(), (firebaseUser) => {
//       if (firebaseUser) {
//         setUser(firebaseUser);
//       } else {
//         setError("User not logged in");
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // Fetch LinkedIn analysis from Firestore and then HTML content
//   useEffect(() => {
//     if (!user) return;

//     const fetchLinkedInAnalysis = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const analysisCollectionRef = collection(db, "Employees", user.uid, "linkedin_analysis");
//         const analysisSnapshot = await getDocs(analysisCollectionRef);

//         if (!analysisSnapshot.empty) {
//           const doc = analysisSnapshot.docs[0]; // only one document exists
//           const data = doc.data();
//           const reportUrl = data.reportUrl;

//           if (reportUrl) {
//             const fullReportUrl = `http://localhost:3000${reportUrl}`; // ensure this matches your backend
//             const res = await fetch(fullReportUrl);

//             if (!res.ok) {
//               throw new Error(`Failed to fetch HTML: ${res.statusText}`);
//             }

//             const html = await res.text();
//             setHtmlContent(html);
//           } else {
//             setError("Report URL not found in analysis data.");
//           }
//         } else {
//           setError("No LinkedIn analysis document found.");
//         }
//       } catch (err: any) {
//         console.error("Error fetching LinkedIn analysis:", err);
//         setError("Failed to fetch LinkedIn analysis.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLinkedInAnalysis();
//   }, [user]);

//   // Inject inline <script> tags into the rendered HTML
//   useEffect(() => {
//     if (!htmlContent || !containerRef.current) return;

//     // Remove previously injected scripts
//     const prevScripts = containerRef.current.querySelectorAll("script[data-injected='true']");
//     prevScripts.forEach(script => script.remove());

//     const tempDoc = document.implementation.createHTMLDocument();
//     tempDoc.body.innerHTML = htmlContent;
//     const scripts = tempDoc.querySelectorAll("script");

//     scripts.forEach((oldScript) => {
//       const newScript = document.createElement("script");
//       let scriptText = oldScript.textContent || "";

//       if (scriptText.includes("DOMContentLoaded")) {
//         const match = scriptText.match(
//           /document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\s*\(\)\s*\{([\s\S]*)\}\);?/
//         );
//         if (match && match[1]) {
//           scriptText = match[1];
//         }
//       }

//       newScript.textContent = `setTimeout(function(){${scriptText}}, 0);`;
//       newScript.async = false;
//       newScript.setAttribute("data-injected", "true");
//       containerRef.current!.appendChild(newScript);
//     });
//   }, [htmlContent]);

//   return (
//     <div className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
//       <h2 className="text-3xl font-bold mb-6 text-gray-800">LinkedIn Profile Analysis</h2>

//       {/* Status Card */}
//       <div className="mb-6">
//         {loading ? (
//           <div className="flex items-center gap-3 text-yellow-600">
//             <RefreshCw className="w-5 h-5 animate-spin" />
//             Loading your analysis...
//           </div>
//         ) : error ? (
//           <div className="flex items-center gap-3 text-red-600">
//             <AlertCircle className="w-5 h-5" />
//             {error}
//           </div>
//         ) : (
//           <div className="flex items-center gap-3 text-green-600">
//             <CheckCircle className="w-5 h-5" />
//             Analysis loaded successfully
//           </div>
//         )}
//       </div>

//       {/* HTML Injection */}
//       {!loading && !error && htmlContent && (
//         <div
//           ref={containerRef}
//           className="prose max-w-none bg-white p-6 rounded-2xl shadow-xl"
//           dangerouslySetInnerHTML={{ __html: htmlContent }}
//         />
//       )}

//       {/* Empty State */}
//       {!loading && !error && !htmlContent && (
//         <div className="text-gray-600 mt-8">
//           No analysis found. Please run a new analysis.
//         </div>
//       )}
//     </div>
//   );
// };

// export default LinkedinAnalysis;
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { RefreshCw, AlertCircle, CheckCircle, Linkedin } from "lucide-react";

const navLinks = [
  { label: "Jobs", to: "/jobs" },
  { label: "Resume Analysis", to: "/resume-analysis" },
  { label: "LinkedIn Analysis", to: "/linkedin-analysis" },
  { label: "Suggested Jobs", to: "/suggested-jobs" },
];

const LinkedinAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  
  // Navbar states
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Navbar effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, "Employees", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          localStorage.setItem("userProfile", JSON.stringify(profileData));
        }
      } else {
        setError("User not logged in");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch LinkedIn analysis from Firestore and then HTML content
  useEffect(() => {
    if (!user) return;

    const fetchLinkedInAnalysis = async () => {
      setLoading(true);
      setError("");
      try {
        const analysisCollectionRef = collection(db, "Employees", user.uid, "linkedin_analysis");
        const analysisSnapshot = await getDocs(analysisCollectionRef);

        if (!analysisSnapshot.empty) {
          const doc = analysisSnapshot.docs[0];
          const data = doc.data();
          const reportUrl = data.reportUrl;

          if (reportUrl) {
            const fullReportUrl = `http://localhost:3000${reportUrl}`;
            const res = await fetch(fullReportUrl);

            if (!res.ok) {
              throw new Error(`Failed to fetch HTML: ${res.statusText}`);
            }

            const html = await res.text();
            setHtmlContent(html);
          } else {
            setError("Report URL not found in analysis data.");
          }
        } else {
          setError("No LinkedIn analysis document found.");
        }
      } catch (err: any) {
        console.error("Error fetching LinkedIn analysis:", err);
        setError("Failed to fetch LinkedIn analysis.");
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedInAnalysis();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Integrated Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50 shadow-sm">
        {/* Hamburger Menu */}
        <div className="relative">
          <button
            className="flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-blue-100 focus:outline-none transition-colors duration-200"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
            <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
            <span className="block w-7 h-0.5 bg-gray-800 rounded transition-all" />
          </button>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => setMenuOpen(false)}
              />
              {/* Menu */}
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                      location.pathname === link.to ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700'
                    } ${link === navLinks[0] ? 'rounded-t-lg' : ''} ${link === navLinks[navLinks.length - 1] ? 'rounded-b-lg' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* LinkedIn Analysis Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LinkedIn Analysis
            </h1>
          </div>
        </div>

        {/* Profile Button */}
        <button
          className="flex items-center gap-2 ml-4 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200"
          onClick={() => navigate("/profile")}
          aria-label="Profile"
        >
          <img
            src={
              profile?.profilePic
                ? `data:image/jpeg;base64,${profile.profilePic}`
                : "/placeholder.svg"
            }
            alt="Profile"
            className="w-8 h-8 rounded-full border object-cover shadow-sm"
          />
          <span className="font-medium text-gray-700 hidden md:inline text-sm">
            {profile?.name || "Profile"}
          </span>
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">LinkedIn Profile Analysis</h2>

        {/* Status Card */}
        <div className="mb-6">
          {loading ? (
            <div className="flex items-center gap-3 text-yellow-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading your analysis...
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Analysis loaded successfully
            </div>
          )}
        </div>

        {/* Report Box */}
        {!loading && !error && htmlContent && (
          <div className="w-[95vw] h-[1000px] rounded-2xl shadow-xl overflow-hidden border border-gray-300 bg-white">
            <iframe
              srcDoc={htmlContent}
              className="w-full h-full"
              sandbox=""
              title="LinkedIn Analysis Report"
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !htmlContent && (
          <div className="text-gray-600 mt-8">
            No analysis found. Please run a new analysis.
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedinAnalysis;