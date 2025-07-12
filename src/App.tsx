import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";//results page
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login"; // Import the Login component
import Signup from "./pages/Signup"; // Import the Signup component
import Profile from "./pages/Profile"; // Import the Profile component
import Jobs from "./pages/JobDescriptionsDashboard"; // Import the correct Jobs component
import LinkedinAnalysis from "./pages/LinkedinAnalysis"; // Import the new LinkedinAnalysis component
import Navbar from "@/components/Navbar";
import EmployerSignup from "./pages/EmployerSignup";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerNavbar from "./components/EmployerNavbar";
import UploadJobDescription from "./pages/UploadJobDescription"; // Import the new UploadJobDescription component
import ViewAllUploads from "./pages/ViewAllUploads"; // Import the ViewAllUploads component
import Matches from "./pages/Matches"; // Import the Matches component
import SuggestedJobs from "./pages/SuggestedJobs"; // Import the SuggestedJobs component
import MockInterviewer from "./pages/MockInterviewer";
import InterviewReport from "./pages/InterviewReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Render navbars based on route */}
        {(() => {
          const path = window.location.pathname;
          // Candidate navbar pages
          if (["/jobs", "/linkedin-analysis", "/resume-analysis", "/profile", "/suggested-jobs", "/mock-interviewer", "/dashboard"].includes(path)) {
            return <Navbar />;
          }
          // Employer navbar pages
          if (["/view-all-uploads", "/upload-job-descriptions", "/matches", "/employer-dashboard", "/employer-profile"].includes(path)) {
            return <EmployerNavbar />;
          }
          // No navbar for all other pages
          return null;
        })()}
        <Routes>
          <Route path="/" element={<Login />} /> {/* Set the root route to render the Login page */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/employer-signup" element={<EmployerSignup />} />
          <Route path="/employer-dashboard" element={<EmployerDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/resume-analysis" element={<Analysis />} />
          <Route
            path="/linkedin-analysis"
            element={
              <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="w-full max-w-5xl mx-auto p-8 rounded-2xl shadow-2xl bg-white border border-gray-200 flex flex-col items-center justify-center">
                  <LinkedinAnalysis />
                </div>
              </div>
            }
          /> {/* Add route for LinkedinAnalysis page */}
          <Route path="/upload-job-descriptions" element={<UploadJobDescription />} /> {/* Add route for UploadJobDescription page */}
          <Route path="/view-all-uploads" element={<ViewAllUploads />} /> {/* Add route for ViewAllUploads page */}
          <Route path="/matches" element={<Matches />} /> {/* Add route for Matches page */}
          <Route path="/suggested-jobs" element={<SuggestedJobs />} /> {/* Add route for SuggestedJobs page */}
          <Route path="/mock-interviewer" element={<MockInterviewer />} /> {/* Add route for MockInterviewer page */}
          <Route path="/interview-report" element={<InterviewReport />} /> {/* Add route for InterviewReport page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
