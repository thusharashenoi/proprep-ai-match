import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { analyzeBase64JDWithGemini } from "../services/jdAnalysisService";
import {
  Upload,
  FileText,
  Edit3,
  Eye,
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  "Data Science",
  "AI",
  "Electrical",
  "Software",
  "Mechanical",
  "Finance",
  "Marketing"
];

const JOB_TYPES = [
  "Full Time",
  "Internship",
  "Part Time",
  "Contract"
];

const PRIORITIES = [
  "High",
  "Medium",
  "Low"
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface JobForm {
  category: string;
  role: string;
  location: string;
  type: string;
  pay: string;
  description: string;
  requirements: string;
  priority: string;
  jdFile: File | null;
}

type EntryMode = "manual" | "upload";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UploadJobDescription = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [form, setForm] = useState<JobForm>({
    category: "",
    role: "",
    location: "",
    type: "",
    pay: "",
    description: "",
    requirements: "",
    priority: "Medium",
    jdFile: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement;
    
    if (name === "jdFile" && target.files) {
      setForm({ ...form, jdFile: target.files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setForm({ ...form, jdFile: file });
      } else {
        setError("Please upload only PDF files.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      setError("You must be logged in to upload a job description.");
      return;
    }

    const employerId = currentUser.uid;

    if (entryMode === "manual") {
      await handleManualSubmit(employerId);
    } else if (entryMode === "upload") {
      await handleFileUpload(employerId);
    }
  };

  const handleManualSubmit = async (employerId: string) => {
    // Validate required fields
    const requiredFields = ['category', 'role', 'location', 'type', 'pay', 'description', 'requirements'];
    const missingFields = requiredFields.filter(field => !form[field as keyof JobForm]);
    
    if (missingFields.length > 0) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, `Employers/${employerId}/jobDescriptions`), {
        ...form,
        timestamp: new Date(),
      });
      
      alert("Job description uploaded successfully!");
      navigate("/employer-dashboard");
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("Failed to upload job description.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (employerId: string) => {
    if (!form.jdFile) {
      setError("Please select a PDF file to upload.");
      return;
    }

    try {
      setLoading(true);

      // Convert PDF to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64PDF = (reader.result as string).split(",")[1];

        // Store raw PDF in subcollection (optional)
        const rawRef = await addDoc(collection(db, `Employers/${employerId}/rawJD`), {
          base64PDF,
          uploadedAt: new Date(),
        });

        // Analyze JD using Gemini AI
        const structuredJD = await analyzeBase64JDWithGemini(base64PDF);

        // Store structured data in jobDescriptions
        await addDoc(collection(db, `Employers/${employerId}/jobDescriptions`), {
          ...structuredJD,
          timestamp: new Date(),
        });

        alert("JD uploaded and analyzed successfully!");
        navigate("/employer-dashboard");
      };

      reader.readAsDataURL(form.jdFile);
    } catch (err) {
      console.error(err);
      setError("Failed to process the uploaded file.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setForm({ ...form, jdFile: null });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  const renderHeader = () => (
    <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/employer-dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">PP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  proprep.ai
                </h1>
                <p className="text-sm text-gray-600">Post New Job</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeroSection = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl mb-4">
        <Briefcase size={32} className="text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Job Posting</h1>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Add a new job opening to your talent pipeline. Choose to enter details manually or upload a PDF job description for AI-powered analysis.
      </p>
    </div>
  );

  const renderEntryModeSelection = () => (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Entry Method</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manual Entry Option */}
        <label className={`relative cursor-pointer ${entryMode === "manual" ? "ring-2 ring-blue-500" : ""}`}>
          <input
            type="radio"
            name="entryMode"
            value="manual"
            checked={entryMode === "manual"}
            onChange={() => setEntryMode("manual")}
            className="sr-only"
          />
          <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
            entryMode === "manual" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${entryMode === "manual" ? "bg-blue-100" : "bg-gray-100"}`}>
                <Edit3 size={20} className={entryMode === "manual" ? "text-blue-600" : "text-gray-600"} />
              </div>
              <h3 className="font-semibold text-gray-900">Manual Entry</h3>
            </div>
            <p className="text-sm text-gray-600">
              Fill out the job details using our structured form. Perfect for creating standardized job postings.
            </p>
          </div>
        </label>

        {/* PDF Upload Option */}
        <label className={`relative cursor-pointer ${entryMode === "upload" ? "ring-2 ring-purple-500" : ""}`}>
          <input
            type="radio"
            name="entryMode"
            value="upload"
            checked={entryMode === "upload"}
            onChange={() => setEntryMode("upload")}
            className="sr-only"
          />
          <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
            entryMode === "upload" 
              ? "border-purple-500 bg-purple-50" 
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${entryMode === "upload" ? "bg-purple-100" : "bg-gray-100"}`}>
                <Upload size={20} className={entryMode === "upload" ? "text-purple-600" : "text-gray-600"} />
              </div>
              <h3 className="font-semibold text-gray-900">Upload PDF</h3>
            </div>
            <p className="text-sm text-gray-600">
              Upload an existing job description PDF and let AI extract and structure the information automatically.
            </p>
          </div>
        </label>
      </div>
    </div>
  );

  const renderBasicInformation = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Briefcase size={20} className="mr-2 text-blue-600" />
        Basic Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            required
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            required
          >
            <option value="">Select Type</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Role/Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role/Position</label>
          <input
            name="role"
            type="text"
            placeholder="e.g., Senior Software Engineer"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={form.role}
            onChange={handleChange}
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              name="location"
              type="text"
              placeholder="e.g., San Francisco, CA"
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Salary/Pay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Salary/Pay</label>
          <div className="relative">
            <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              name="pay"
              type="text"
              placeholder="e.g., $80k-$120k annually"
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={form.pay}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Priority Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderJobDetails = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText size={20} className="mr-2 text-purple-600" />
        Job Details
      </h3>
      <div className="space-y-4">
        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea
            name="description"
            placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Requirements & Qualifications</label>
          <textarea
            name="requirements"
            placeholder="List required skills, experience, education, and any other qualifications..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            value={form.requirements}
            onChange={handleChange}
            required
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderPreviewSection = () => {
    if (!form.role && !form.location && !form.pay) return null;

    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye size={20} className="mr-2 text-indigo-600" />
          Preview
        </h3>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{form.role || "Job Title"}</h4>
            {form.priority && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(form.priority)}`}>
                {form.priority} Priority
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
            {form.location && (
              <span className="flex items-center">
                <MapPin size={14} className="mr-1" />
                {form.location}
              </span>
            )}
            {form.type && (
              <span className="flex items-center">
                <Clock size={14} className="mr-1" />
                {form.type}
              </span>
            )}
            {form.pay && (
              <span className="flex items-center">
                <DollarSign size={14} className="mr-1" />
                {form.pay}
              </span>
            )}
          </div>
          
          {form.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {form.category}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderManualForm = () => (
    <form onSubmit={handleSubmit} className="p-8">
      <div className="space-y-6">
        {renderBasicInformation()}
        {renderJobDetails()}
        {renderPreviewSection()}
        {renderErrorDisplay()}
        {renderActionButtons()}
      </div>
    </form>
  );

  const renderFileUploadArea = () => (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
        dragActive
          ? "border-purple-400 bg-purple-50"
          : form.jdFile
          ? "border-green-400 bg-green-50"
          : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        name="jdFile"
        accept=".pdf"
        onChange={handleChange}
        ref={fileInputRef}
        className="hidden"
      />
      
      {form.jdFile ? (
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">File Selected</h4>
            <p className="text-sm text-gray-600 mb-2">{form.jdFile.name}</p>
            <p className="text-xs text-gray-500">
              Size: {(form.jdFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl">
            <FileText size={32} className="text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Drop your PDF here, or click to browse
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Supports PDF files up to 10MB
            </p>
            <button
              type="button"
              onClick={openFileDialog}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Choose File
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderUploadForm = () => (
    <div className="p-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload size={20} className="mr-2 text-purple-600" />
            Upload Job Description PDF
          </h3>
          <p className="text-gray-600 mb-6">
            Upload your job description PDF and our AI will automatically extract and structure all the relevant information for you.
          </p>
        </div>

        {renderFileUploadArea()}
        {renderErrorDisplay()}
        {renderActionButtons()}
      </div>
    </div>
  );

  const renderErrorDisplay = () => {
    if (!error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
        <AlertCircle size={20} className="text-red-600 mr-3 flex-shrink-0" />
        <div className="text-red-700">{error}</div>
      </div>
    );
  };

  const renderActionButtons = () => (
    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
      <Button
        type={entryMode === "manual" ? "submit" : "button"}
        onClick={entryMode === "upload" ? handleSubmit : undefined}
        disabled={loading || (entryMode === "upload" && !form.jdFile)}
        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            {entryMode === "manual" ? "Publishing..." : "Processing..."}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {entryMode === "manual" ? (
              <>
                <CheckCircle size={18} className="mr-2" />
                Publish Job
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                Upload & Analyze
              </>
            )}
          </div>
        )}
      </Button>
      
      <Button
        type="button"
        onClick={() => navigate("/view-all-uploads")}
        className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
      >
        <div className="flex items-center justify-center">
          <Eye size={18} className="mr-2" />
          View All Jobs
        </div>
      </Button>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
          <Edit3 size={24} className="text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Easy Manual Entry</h3>
        <p className="text-sm text-gray-600">
          Structured form with intelligent fields to create professional job postings quickly.
        </p>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
          <Upload size={24} className="text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Upload</h3>
        <p className="text-sm text-gray-600">
          Upload existing PDFs and let AI extract all relevant information automatically.
        </p>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4">
          <Star size={24} className="text-indigo-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
        <p className="text-sm text-gray-600">
          Your jobs will be intelligently matched with qualified candidates in our system.
        </p>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      {renderHeader()}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {renderHeroSection()}

        {/* Entry Mode Selection */}
        {renderEntryModeSelection()}

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          {entryMode === "manual" ? renderManualForm() : renderUploadForm()}
        </div>

        {/* Features Section */}
        {renderFeaturesSection()}
      </div>
    </div>
  );
};

export default UploadJobDescription;