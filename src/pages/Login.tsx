import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"candidate" | "employer">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Check both collections to determine the actual user type
      const employeeRef = doc(db, "Employees", uid);
      const employerRef = doc(db, "Employers", uid);
      
      const [employeeSnap, employerSnap] = await Promise.all([
        getDoc(employeeRef),
        getDoc(employerRef)
      ]);

      let actualUserType: "candidate" | "employer" | null = null;
      let userData = null;

      if (employeeSnap.exists()) {
        actualUserType = "candidate";
        userData = employeeSnap.data();
      } else if (employerSnap.exists()) {
        actualUserType = "employer";
        userData = employerSnap.data();
      }

      if (!actualUserType || !userData) {
        // Sign out the user since no profile exists
        await auth.signOut();
        setError("Profile not found. Please contact support.");
        return;
      }

      // Verify that the selected user type matches the actual user type
      if (userType !== actualUserType) {
        // Sign out the user to prevent unauthorized access
        await auth.signOut();
        const expectedType = actualUserType === "candidate" ? "Employee/Candidate" : "Employer/Company";
        setError(`Invalid login type. Please select "${expectedType}" and try again.`);
        return;
      }

      // Login successful - navigate to appropriate dashboard
      console.log("Login Success:", userData);
      if (actualUserType === "candidate") {
        navigate("/jobs");
      } else if (actualUserType === "employer") {
        navigate("/employer-dashboard");
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError("Invalid email or password");
    }
  };

  const candidateFeatures = [
    {
      icon: "📄",
      title: "Smart Resume Analysis",
      description: "Upload your resume and get detailed analysis with ATS score and improvement recommendations"
    },
    {
      icon: "💼",
      title: "LinkedIn Profile Optimization",
      description: "Connect your LinkedIn profile for automatic analysis and personalized improvement suggestions"
    },
    {
      icon: "🎯",
      title: "Intelligent Job Matching",
      description: "Find jobs that perfectly match your skills and experience with our AI-powered matching system"
    },
    {
      icon: "🔍",
      title: "Job Portal Access",
      description: "Apply to curated job opportunities that align with your profile and career goals"
    }
  ];

  const employerFeatures = [
    {
      icon: "👤",
      title: "Simple Profile Setup",
      description: "Create your company profile quickly and start finding the right candidates"
    },
    {
      icon: "📋",
      title: "Job Description Management",
      description: "Upload JDs or manually enter job requirements with our intuitive interface"
    },
    {
      icon: "🔎",
      title: "Candidate Discovery",
      description: "Browse through detailed candidate profiles and find the perfect fit for your team"
    },
    {
      icon: "⚡",
      title: "Smart Matching",
      description: "Get AI-powered candidate recommendations based on your job descriptions"
    }
  ];

  const upcomingFeatures = [
    {
      icon: "🎤",
      title: "Mock Interviewer",
      description: "Practice interviews with AI-powered mock interviews (Coming Soon)"
    },
    {
      icon: "✨",
      title: "Resume Fixer",
      description: "Automated resume improvement and formatting tools (Coming Soon)"
    }
  ];

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 border border-white/20">
          <div className="text-center mb-4">
            <button 
              onClick={() => setShowLogin(false)}
              className="text-gray-500 hover:text-gray-700 float-left text-xl"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sign In
            </h1>
          </div>

          <div className="flex justify-center gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                userType === "candidate" 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setUserType("candidate")}
            >
              Employee/Candidate
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                userType === "employer" 
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setUserType("employer")}
            >
              Employer/Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              Sign In
            </button>
          </form>

          <div className="flex flex-col items-center mt-4 space-y-2">
            <Link to="#" className="text-blue-600 hover:text-blue-700 transition-colors">
              Forgot password?
            </Link>
            {userType === "candidate" ? (
              <span className="text-sm text-gray-600">
                New user?{" "}
                <button
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  onClick={() => navigate("/signup")}
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span className="text-sm text-gray-600">
                New employer?{" "}
                <button
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  onClick={() => navigate("/employer-signup")}
                >
                  Apply for License
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                proprep.ai
              </h1>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Your Career Success
            </span>
            <br />
            <span className="text-gray-800">Starts Here</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            The ultimate AI-powered platform to analyze your resume, optimize your LinkedIn profile, 
            and connect with the perfect job opportunities. Whether you're a job seeker or employer, 
            we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setUserType("candidate");
                setShowLogin(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
            >
              I'm Looking for Jobs 🚀
            </button>
            <button
              onClick={() => {
                setUserType("employer");
                setShowLogin(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
            >
              I'm Hiring Talent 💼
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
            <div className="text-gray-600">Resumes Analyzed</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="text-3xl font-bold text-purple-600 mb-2">5,000+</div>
            <div className="text-gray-600">Job Matches Made</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="text-3xl font-bold text-indigo-600 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>
      </section>

      {/* Features for Candidates */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">For Job Seekers</h2>
          <p className="text-xl text-gray-600">Supercharge your job search with AI-powered tools</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {candidateFeatures.map((feature, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features for Employers */}
      <section className="bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">For Employers</h2>
            <p className="text-xl text-gray-600">Find the perfect candidates with intelligent matching</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {employerFeatures.map((feature, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Coming Soon</h2>
          <p className="text-xl text-gray-600">Exciting new features to enhance your experience</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {upcomingFeatures.map((feature, index) => (
            <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-dashed border-yellow-300 hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already upgraded their career journey with proprep.ai
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setUserType("candidate");
                setShowLogin(true);
              }}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
            >
              Get Started as Job Seeker
            </button>
            <button
              onClick={() => {
                setUserType("employer");
                setShowLogin(true);
              }}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-medium hover:bg-white/30 hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
            >
              Start Hiring
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <h3 className="text-2xl font-bold">proprep.ai</h3>
            </div>
            <p className="text-gray-400 mb-4">Your one-step platform for career success</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-white transition-colors">Contact Us</Link>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800 text-sm text-gray-400">
              © 2025 proprep.ai. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;