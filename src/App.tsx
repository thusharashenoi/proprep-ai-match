import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login"; // Import the Login component
import Signup from "./pages/Signup"; // Import the Signup component
import Profile from "./pages/Profile"; // Import the Profile component
import Jobs from "./pages/JobDescriptionsDashboard"; // Import the correct Jobs component
import LinkedinAnalysis from "./pages/LinkedinAnalysis"; // Import the new LinkedinAnalysis component
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} /> {/* Set the root route to render the Login page */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
