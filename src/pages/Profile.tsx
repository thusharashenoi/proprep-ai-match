import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisService } from "@/services/analysisService";

const Profile = ({ onProfileSaved }: { onProfileSaved?: () => void }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [error, setError] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  // Add a new state for edit mode
  const [editSection, setEditSection] = useState<null | 'education' | 'experience' | 'skills'>(null);
  const [educationDraft, setEducationDraft] = useState<any[]>([]);
  const [experienceDraft, setExperienceDraft] = useState<any[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setName(parsed.name || "");
      setEmail(parsed.email || "");
      setPhone(parsed.phone || "");
      setLinkedinUrl(parsed.linkedinUrl || "");
      // --- Normalize resumeAnalysis fields for robust display ---
      let ra = parsed.resumeAnalysis || {};
      // If 'experiences' exists but 'experience' does not, map it
      if (!ra.experience && Array.isArray(ra.experiences)) ra.experience = ra.experiences;
      // If education/skills/experience are missing, try to get from profile root (for legacy or modal saves)
      ra.education = Array.isArray(ra.education) ? ra.education : (Array.isArray(parsed.education) ? parsed.education : []);
      ra.experience = Array.isArray(ra.experience) ? ra.experience : (Array.isArray(parsed.experience) ? parsed.experience : []);
      ra.skills = Array.isArray(ra.skills) ? ra.skills : (Array.isArray(parsed.skills) ? parsed.skills : []);
      // --- PATCH: If education is empty but educationText exists and is an array, use it ---
      if ((!ra.education || ra.education.length === 0) && Array.isArray(ra.educationText)) {
        ra.education = ra.educationText;
      }
      setResumeAnalysis(ra);
      setProfilePic(parsed.profilePic || null);
      setProfileLoaded(true);
    } else {
      setProfileLoaded(false);
    }
  }, []);

  useEffect(() => {
    if (editSection === 'education') {
      setEducationDraft(JSON.parse(JSON.stringify(resumeAnalysis.education || [])));
    }
    if (editSection === 'experience') {
      setExperienceDraft(JSON.parse(JSON.stringify(resumeAnalysis.experience || [])));
    }
  }, [editSection]);

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf" && file.size <= 10 * 1024 * 1024) {
      setResumeFile(file);
    } else {
      setError("Please upload a valid PDF file under 10MB.");
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !resumeFile) {
      setError("All fields except LinkedIn are required.");
      return;
    }
    if (!password || !confirmPassword) {
      setPasswordError("Please enter and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    // Extract details from resume using Gemini
    let analysisResult;
    try {
      analysisResult = await AnalysisService.analyzeResumeWithGemini(resumeFile);
      setResumeAnalysis(analysisResult); // update state for immediate UI feedback
    } catch (err) {
      setError("Resume parsing failed. Please try again.");
      return;
    }
    // --- NEW: Trigger LinkedIn analysis if URL is provided ---
    if (linkedinUrl) {
      try {
        await fetch("http://localhost:3000/api/linkedin/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileUrl: linkedinUrl }),
        });
      } catch (err) {
        // Optionally handle error, but don't block signup
        console.error("LinkedIn analysis failed", err);
      }
    }
    const profile = { name, email, phone, linkedinUrl, resumeAnalysis: analysisResult, profilePic };
    localStorage.setItem("userProfile", JSON.stringify(profile));
    if (onProfileSaved) {
      onProfileSaved();
    } else {
      // Redirect to jobs after save
      window.location.href = "/jobs";
    }
  };

  if (profileLoaded && !error && !editSection) {
    // Full-page, white background, black text profile summary with clean formatting
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto p-10 rounded-2xl shadow-2xl bg-white border border-gray-200">
          {/* Profile Picture Display and Edit */}
          <div className="flex flex-col items-center mb-6">
            <label htmlFor="profile-pic-upload-summary" className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                )}
                {/* Camera icon overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2" /></svg>
                </div>
              </div>
              <input id="profile-pic-upload-summary" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
            </label>
            <span className="text-xs text-gray-500 mt-2">Click to change profile picture</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <div className="text-3xl font-bold text-black mb-2 font-sans">{name}</div>
              <div className="text-lg text-black mb-1 font-sans">{email}</div>
              <div className="text-lg text-black mb-1 font-sans">{phone}</div>
              {linkedinUrl && <a href={linkedinUrl} className="text-black underline font-sans" target="_blank" rel="noopener noreferrer">{linkedinUrl}</a>}
            </div>
            <div>
              <Button variant="outline" onClick={() => setProfileLoaded(false)}>Edit Profile</Button>
            </div>
          </div>
          {/* Personal Info (from Gemini) */}
          {resumeAnalysis.personalInfo && (
            <div className="mb-8">
              <div className="text-xl font-semibold text-black border-b border-gray-300 pb-1 font-sans mb-2">Personal Information (AI Extracted)</div>
              <ul className="text-base text-gray-700 font-sans space-y-1">
                {Object.entries(resumeAnalysis.personalInfo).map(([key, value]: any, i) => (
                  <li key={i}><span className="font-semibold capitalize">{key}:</span> {value}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Education section (modern, readable, not editable here) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xl font-semibold text-black border-b border-gray-300 pb-1 font-sans">Education</div>
              <Button size="sm" variant="ghost" onClick={() => setEditSection('education')}>Edit</Button>
            </div>
            <div className="space-y-4">
              {(Array.isArray(resumeAnalysis.education) && resumeAnalysis.education.length > 0) ? (
                resumeAnalysis.education.map((edu: any, i: number) => {
                  // If it's an object, extract fields robustly
                  if (typeof edu === 'object' && edu !== null) {
                    const name = edu["Name of Institute"] || edu.institution || edu.name || '';
                    const degree = edu.Degree || edu.degree || edu["Degree Pursued"] || '';
                    const field = edu.Field || edu.field || edu["Field of Study"] || '';
                    const location = edu.Location || edu.location || '';
                    const duration = edu.Duration || edu.duration || '';
                    const grade = edu.Grade || edu.grade || '';
                    return (
                      <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 mb-2">
                        {name && <div className="text-lg font-bold text-black font-sans mb-0.5">{name}</div>}
                        {degree && <div className="text-base font-semibold text-gray-800 font-sans mb-1">{degree}</div>}
                        {field && <div className="text-base text-gray-700 font-sans mb-0.5">{field}</div>}
                        {location && <div className="text-base text-gray-700 font-sans mb-0.5">{location}</div>}
                        {duration && <div className="text-base text-gray-700 font-sans mb-0.5">{duration}</div>}
                        {grade && <div className="text-base text-gray-700 font-sans mb-0.5">Grade: {grade}</div>}
                      </div>
                    );
                  }
                  // If it's a string, handle as before
                  if (typeof edu === 'string') {
                    let entries: string[] = [];
                    if (/Name of Institute:/i.test(edu) && edu.match(/Name of Institute:/gi)?.length > 1) {
                      const parts = edu.split(/(?=Name of Institute:)/i).map(s => s.trim()).filter(Boolean);
                      entries = parts;
                    } else {
                      entries = [edu];
                    }
                    return entries.map((entry, j) => {
                      let _name = '', _degree = '', _field = '', _location = '', _duration = '', _grade = '';
                      const nameMatch = entry.match(/Name of Institute:\s*([^\n]*)/i);
                      const degreeMatch = entry.match(/Degree:\s*([^\n]*)/i);
                      const fieldMatch = entry.match(/Field(?: of Study)?:\s*([^\n]*)/i);
                      const locationMatch = entry.match(/Location:\s*([^\n]*)/i);
                      const durationMatch = entry.match(/Duration:\s*([^\n]*)/i);
                      const gradeMatch = entry.match(/Grade:\s*([^\n]*)/i);
                      _name = nameMatch ? nameMatch[1].trim() : '';
                      _degree = degreeMatch ? degreeMatch[1].trim() : '';
                      _field = fieldMatch ? fieldMatch[1].trim() : '';
                      _location = locationMatch ? locationMatch[1].trim() : '';
                      _duration = durationMatch ? durationMatch[1].trim() : '';
                      _grade = gradeMatch ? gradeMatch[1].trim() : '';
                      return (
                        <div key={j} className="bg-white rounded-lg p-4 border border-gray-200 mb-2">
                          {_name && <div className="text-lg font-bold text-black font-sans mb-0.5">{_name}</div>}
                          {_degree && <div className="text-base font-semibold text-gray-800 font-sans mb-1">{_degree}</div>}
                          {_field && <div className="text-base text-gray-700 font-sans mb-0.5">{_field}</div>}
                          {_location && <div className="text-base text-gray-700 font-sans mb-0.5">{_location}</div>}
                          {_duration && <div className="text-base text-gray-700 font-sans mb-0.5">{_duration}</div>}
                          {_grade && <div className="text-base text-gray-700 font-sans mb-0.5">Grade: {_grade}</div>}
                        </div>
                      );
                    });
                  }
                  return null;
                })
              ) : (
                <div className="text-gray-500">No education data found.</div>
              )}
            </div>
          </div>
          {/* Experience section (modern, readable) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xl font-semibold text-black border-b border-gray-300 pb-1 font-sans">Experience</div>
              <Button size="sm" variant="ghost" onClick={() => setEditSection('experience')}>Edit</Button>
            </div>
            <div className="space-y-4">
              {editSection === 'experience' ? (
                <div>
                  {(experienceDraft || []).map((exp: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 mb-2">
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 mb-1 font-bold"
                        placeholder="Company Name (e.g. Google)"
                        value={exp["Name of Company"] || exp.company || ''}
                        onChange={e => {
                          const updated = [...experienceDraft];
                          updated[i] = { ...updated[i], ["Name of Company"]: e.target.value };
                          setExperienceDraft(updated);
                        }}
                      />
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 mb-1"
                        placeholder="Location (e.g. Mountain View, CA)"
                        value={exp.Location || exp.location || ''}
                        onChange={e => {
                          const updated = [...experienceDraft];
                          updated[i] = { ...updated[i], Location: e.target.value };
                          setExperienceDraft(updated);
                        }}
                      />
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 mb-1"
                        placeholder="Duration (e.g. 2021 - 2023)"
                        value={exp.Duration || exp.duration || exp.dates || ''}
                        onChange={e => {
                          const updated = [...experienceDraft];
                          updated[i] = { ...updated[i], Duration: e.target.value };
                          setExperienceDraft(updated);
                        }}
                      />
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        placeholder="Summary (e.g. Led a team to build... or bullet points)"
                        value={exp["Brief Job"] || exp.summary || ''}
                        onChange={e => {
                          const updated = [...experienceDraft];
                          updated[i] = { ...updated[i], summary: e.target.value };
                          setExperienceDraft(updated);
                        }}
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm" variant="destructive" onClick={() => {
                          const updated = [...experienceDraft];
                          updated.splice(i, 1);
                          setExperienceDraft(updated);
                        }}>Remove</Button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                    setExperienceDraft([
                      ...experienceDraft,
                      { "Name of Company": '', Location: '', Duration: '', summary: '' }
                    ]);
                  }}>Add Experience</Button>
                  <div className="flex gap-2 mt-4">
                    <Button type="button" className="w-full" onClick={() => {
                      // Save changes: update resumeAnalysis, persist to localStorage, exit edit mode
                      const updatedAnalysis = { ...resumeAnalysis, experience: experienceDraft };
                      setResumeAnalysis(updatedAnalysis);
                      // Also update localStorage
                      const stored = localStorage.getItem("userProfile");
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.resumeAnalysis = { ...parsed.resumeAnalysis, experience: experienceDraft };
                        localStorage.setItem("userProfile", JSON.stringify(parsed));
                      }
                      setEditSection(null);
                      setProfileLoaded(true);
                    }}>Save</Button>
                    <Button type="button" variant="outline" onClick={() => {
                      // Cancel: revert draft, exit edit mode
                      setExperienceDraft(JSON.parse(JSON.stringify(resumeAnalysis.experience || [])));
                      setEditSection(null);
                      setProfileLoaded(true);
                    }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                (Array.isArray(resumeAnalysis.experience) && resumeAnalysis.experience.length > 0) ? (
                  resumeAnalysis.experience.map((exp: any, i: number) => {
                    const company = exp["Name of Company"] || exp.company || (typeof exp === 'string' ? exp : "");
                    const location = exp.Location || exp.location || exp["Location"] || "";
                    const duration = exp.Duration || exp.duration || exp["Duration"] || exp.dates || "";
                    const summary = exp["Brief Job"] || exp.summary || "";
                    return (
                      <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-lg font-bold text-black font-sans mb-1">{company}</div>
                        {location && <div className="text-base text-gray-700 font-sans mb-1">{location}</div>}
                        {duration && <div className="text-base text-gray-700 font-sans mb-1">{duration}</div>}
                        {summary && <div className="text-base text-gray-800 font-sans mt-2">{summary}</div>}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500">No experience data found.</div>
                )
            )}
            </div>
          </div>
          {/* Skills section (competency bubbles) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xl font-semibold text-black border-b border-gray-300 pb-1 font-sans">Skills & Competencies</div>
              <Button size="sm" variant="ghost" onClick={() => setEditSection('skills')}>Edit</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Flatten and deduplicate all skills/competencies, only show skill names (no brackets, quotes, headings, or category labels)
                let skillsArr: string[] = [];
                if (resumeAnalysis.skills && typeof resumeAnalysis.skills === 'object' && !Array.isArray(resumeAnalysis.skills)) {
                  // If skills is an object (e.g., { Technical Skills: [...], ... })
                  Object.entries(resumeAnalysis.skills).forEach(([key, val]: any) => {
                    if (Array.isArray(val)) {
                      skillsArr.push(...val);
                    } else if (typeof val === 'string') {
                      // Split by comma, newline, or semicolon
                      skillsArr.push(...val.split(/,|\n|;/).map(s => s.trim()));
                    }
                  });
                } else if (Array.isArray(resumeAnalysis.skills)) {
                  skillsArr = resumeAnalysis.skills;
                }
                // Remove empty, deduplicate, and filter out anything that looks like a heading or formatting
                skillsArr = Array.from(new Set(skillsArr.map(s => s.trim()).filter(s => s && !/^[\[\]{}"':,]|skills|certifications|languages|professional/i.test(s))));
                return skillsArr.length > 0 ? (
                  skillsArr.map((skill, i) => (
                    <span key={i} className="bg-black text-white px-3 py-1 rounded-full text-sm font-sans font-medium">{skill}</span>
                  ))
                ) : (
                  <span className="text-gray-500">No skills data found.</span>
                );
              })()}
            </div>
          </div>

          {/* Projects section (modern, readable, title bold, description below) */}
          {resumeAnalysis.projects && Array.isArray(resumeAnalysis.projects) && resumeAnalysis.projects.length > 0 && (
            <div className="mb-8">
              <div className="text-xl font-semibold text-black border-b border-gray-300 pb-1 font-sans mb-2">Projects</div>
              <div className="space-y-4">
                {resumeAnalysis.projects.map((proj: any, i: number) => {
                  let name = '', brief = '';
                  if (typeof proj === 'object' && proj !== null) {
                    name = proj.name || proj.title || '';
                    brief = proj.brief || proj.summary || proj.description || '';
                    // If no brief but object has other keys, try to join them for display
                    if (!brief) {
                      const keys = Object.keys(proj).filter(k => !['name','title','brief','summary','description'].includes(k));
                      if (keys.length > 0) {
                        brief = keys.map(k => `${k[0].toUpperCase() + k.slice(1)}: ${proj[k]}`).join(' | ');
                      }
                    }
                  } else if (typeof proj === 'string') {
                    // Try to extract name and brief from string
                    const match = proj.match(/^(.*?):\s*(.*)$/);
                    if (match) {
                      name = match[1].trim();
                      brief = match[2] ? match[2].trim() : '';
                    } else {
                      name = proj;
                    }
                  }
                  // If both name and brief are empty, show the raw string
                  if (!name && !brief && typeof proj === 'string') {
                    name = proj;
                  }
                  // If name is empty but brief exists, swap them
                  if (!name && brief) {
                    name = brief;
                    brief = '';
                  }
                  return (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-lg font-bold text-black font-sans mb-1">{name}</div>
                      {brief && <div className="text-base text-gray-800 font-sans mt-1">{brief}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode for profile or sections
  if (!profileLoaded || !!editSection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>{editSection === 'education' ? 'Edit Education' : editSection === 'experience' ? 'Edit Experience' : editSection === 'skills' ? 'Edit Skills' : 'Create or Edit Your Profile'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Profile Picture Upload */}
            {!editSection && (
              <div className="flex flex-col items-center mb-6">
                <label htmlFor="profile-pic-upload" className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="object-cover w-full h-full" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2" /></svg>
                    </div>
                  </div>
                  <input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                </label>
                <span className="text-xs text-gray-500 mt-2">Click to upload profile picture</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border rounded px-3 py-2"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={!!editSection}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={!!editSection}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full border rounded px-3 py-2"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                disabled={!!editSection}
              />
              <label className="block w-full">
                <span className="block mb-1 font-medium text-gray-700">Upload Resume (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="w-full"
                  onChange={handleResumeUpload}
                  required={!resumeAnalysis}
                  disabled={!!editSection}
                />
              </label>
              <input
                type="url"
                placeholder="LinkedIn Profile URL (optional)"
                className="w-full border rounded px-3 py-2"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                disabled={!!editSection}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full border rounded px-3 py-2"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={!!editSection}
              />
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full border rounded px-3 py-2 pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={!!editSection}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.45-2.05A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.45 2.05A9.956 9.956 0 0112 21c-2.21 0-4.26-.72-5.9-1.95M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c2.042 0 3.97.613 5.542 1.658M21.542 12C20.268 16.057 16.477 19 12 19c-2.042 0-3.97-.613-5.542-1.658" /></svg>
                  )}
                </button>
              </div>
              {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex gap-2">
                <Button type="submit" className="w-full">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => { setEditSection(null); setProfileLoaded(true); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Profile;
