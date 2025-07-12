import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const defaultProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  linkedinUrl: "",
  profilePic: "",
  experiences: [],
  education: [],
  skills: [],
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(defaultProfile);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Load profile from localStorage or backend
    const stored = localStorage.getItem("userProfile");
    if (stored) setProfile(JSON.parse(stored));
  }, []);

  const handleProfileClick = () => setShowProfile(true);
  const handleProfileClose = () => setShowProfile(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20">
      {/* pt-20 ensures content starts just below the fixed Navbar, with no overlap */}
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Welcome, {profile.name || "User"}!</h2>
            <p className="text-gray-600 mb-4">This is your dashboard. You can start your job analysis or update your profile.</p>
            <Button onClick={() => navigate("/job-descriptions")}>Go to Job Descriptions</Button>
          </CardContent>
        </Card>
      </div>
      {showProfile && <ProfileModal profile={profile} setProfile={setProfile} onClose={handleProfileClose} />}
    </div>
  );
};

// ProfileModal component (inline for simplicity)
const ProfileModal = ({ profile, setProfile, onClose }: any) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(profile);
  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePicUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm((f: any) => ({ ...f, profilePic: reader.result }));
      reader.readAsDataURL(file);
    }
  };
  const handleSave = () => {
    setProfile(form);
    localStorage.setItem("userProfile", JSON.stringify(form));
    setEditMode(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
        <div className="flex items-center gap-6 mb-6">
          <label className="relative cursor-pointer">
            <img src={profile.profilePic || "/placeholder.svg"} alt="Profile" className="w-20 h-20 rounded-full object-cover border" />
          </label>
          <div>
            <h3 className="text-xl font-bold">{form.name}</h3>
            <p className="text-gray-500">{form.email}</p>
            <p className="text-gray-500">{form.phone}</p>
            {form.linkedinUrl && <a href={form.linkedinUrl} className="text-blue-600" target="_blank" rel="noopener noreferrer">{form.linkedinUrl}</a>}
          </div>
        </div>
        {/* Show parsed resume details if available */}
        {form.resumeAnalysis && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold mb-2 text-blue-900">Resume Details Extracted</h3>
            {form.resumeAnalysis.education && form.resumeAnalysis.education.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Education:</span>
                <ul className="list-disc pl-5 text-gray-800 text-sm">
                  {form.resumeAnalysis.education.map((edu: string, i: number) => <li key={i}>{edu}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.experience && form.resumeAnalysis.experience.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Experience:</span>
                <ul className="list-disc pl-5 text-gray-800 text-sm">
                  {form.resumeAnalysis.experience.map((exp: string, i: number) => <li key={i}>{exp}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.skills && form.resumeAnalysis.skills.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Skills:</span>
                <ul className="list-disc pl-5 text-gray-800 text-sm">
                  {form.resumeAnalysis.skills.map((skill: string, i: number) => <li key={i}>{skill}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.strengths && form.resumeAnalysis.strengths.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Strengths:</span>
                <ul className="list-disc pl-5 text-green-800 text-sm">
                  {form.resumeAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.weaknesses && form.resumeAnalysis.weaknesses.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Weaknesses:</span>
                <ul className="list-disc pl-5 text-red-800 text-sm">
                  {form.resumeAnalysis.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.atsImprovementTips && form.resumeAnalysis.atsImprovementTips.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Layout/Visual Suggestions:</span>
                <ul className="list-disc pl-5 text-blue-800 text-sm">
                  {form.resumeAnalysis.atsImprovementTips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.resumeImprovementTips && form.resumeAnalysis.resumeImprovementTips.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Content Suggestions:</span>
                <ul className="list-disc pl-5 text-blue-800 text-sm">
                  {form.resumeAnalysis.resumeImprovementTips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}
            {form.resumeAnalysis.atsSubscores && (
              <div className="mb-2">
                <span className="font-semibold">ATS Subscores:</span>
                <ul className="grid grid-cols-2 gap-2 mt-1">
                  <li>Content Quality: <span className="font-bold text-blue-700">{form.resumeAnalysis.atsSubscores.contentQuality}/100</span></li>
                  <li>Visual Design: <span className="font-bold text-blue-700">{form.resumeAnalysis.atsSubscores.visualDesign}/100</span></li>
                  <li>Readability: <span className="font-bold text-blue-700">{form.resumeAnalysis.atsSubscores.readability}/100</span></li>
                  <li>Technical Compliance: <span className="font-bold text-blue-700">{form.resumeAnalysis.atsSubscores.technicalCompliance}/100</span></li>
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Skills</h4>
          {editMode ? (
            <input name="skills" value={form.skills?.join(", ") || ""} onChange={e => setForm({ ...form, skills: e.target.value.split(",").map((s: string) => s.trim()) })} className="w-full border rounded px-2 py-1" />
          ) : (
            <div className="flex flex-wrap gap-2">{form.skills?.map((s: string, i: number) => <span key={i} className="bg-blue-100 px-2 py-1 rounded text-sm">{s}</span>)}</div>
          )}
        </div>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Education</h4>
          {editMode ? (
            <textarea name="education" value={form.education?.join("\n") || ""} onChange={e => setForm({ ...form, education: e.target.value.split("\n") })} className="w-full border rounded px-2 py-1" />
          ) : (
            <ul className="list-disc pl-5 text-gray-700">{form.education?.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
          )}
        </div>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Experience</h4>
          {editMode ? (
            <textarea name="experiences" value={form.experiences?.join("\n") || ""} onChange={e => setForm({ ...form, experiences: e.target.value.split("\n") })} className="w-full border rounded px-2 py-1" />
          ) : (
            <ul className="list-disc pl-5 text-gray-700">{form.experiences?.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
          )}
        </div>
        {editMode && (
          <div className="mb-4">
            <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="w-full border rounded px-2 py-1 mb-2" />
          </div>
        )}
        <div className="flex gap-4 justify-end">
          {editMode ? (
            <>
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
