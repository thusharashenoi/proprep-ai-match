

import { useState } from "react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { extract_resume } from "@/services/extract_resume";
import { AnalysisService } from "@/services/analyse_resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const roles = [
  "Data Scientist",
  "Software Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "AI/ML Engineer",
  "Product Manager",
  "UI/UX Designer",
];

const EmployeeSignup = () => {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!resumeFile || !profilePic) {
      alert("Please upload both a resume and a profile picture.");
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const employeeId = uuidv4();

      // Convert files to base64
      const profilePicBase64 = await fileToBase64(profilePic);
      const resumeBase64 = await fileToBase64(resumeFile);

      // Step 1: Extract data from resume
      const parsedData = await extract_resume(resumeBase64, {
        name,
        email,
        phone,
        linkedin: linkedIn,
      });

      // Step 2: Analyze resume using Gemini
      const resumeAnalysis = await AnalysisService.analyzeBase64ResumeWithGemini(resumeBase64);

      // Step 3: Store all data in Firestore
      await setDoc(doc(db, "Employees", user.uid), {
        id: employeeId,
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        linkedIn: parsedData.linkedin,
        profilePic: profilePicBase64,
        role,
        resumeAnalysis, // Full analysis data from Gemini
      });

      alert("Signup, Resume Extraction, and Analysis Successful!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = (reader.result as string)?.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  return (
    <Card className="max-w-xl mx-auto mt-10 p-6 shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Employee Signup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files?.[0] || null)} />
        <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-md text-gray-700"
        >
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Input type="url" placeholder="LinkedIn Profile URL" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} />
        <Input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button onClick={handleSignup} disabled={loading} className="w-full">
          {loading ? "Processing..." : "Sign Up"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmployeeSignup;
