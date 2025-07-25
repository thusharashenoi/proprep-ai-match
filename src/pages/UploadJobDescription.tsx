


// import { useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { getAuth } from "firebase/auth";
// import { db } from "../firebase"; // Adjust the path if needed
// import { collection, addDoc } from "firebase/firestore";

// const categories = ["Data Science", "AI", "Electrical", "Software", "Mechanical", "Finance", "Marketing"];
// const types = ["Full Time", "Internship", "Part Time", "Contract"];
// const priorities = ["High", "Medium", "Low"];

// const UploadJobDescription = () => {
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);
//   const [entryMode, setEntryMode] = useState("manual");
//   const [form, setForm] = useState({
//     category: "",
//     role: "",
//     location: "",
//     type: "",
//     pay: "",
//     description: "",
//     requirements: "",
//     priority: "Medium",
//     jdFile: null,
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === "jdFile") {
//       setForm({ ...form, jdFile: files[0] });
//     } else {
//       setForm({ ...form, [name]: value });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     const auth = getAuth();
//     const currentUser = auth.currentUser;

//     if (!currentUser) {
//       setError("You must be logged in to upload a job description.");
//       return;
//     }

//     const employerId = currentUser.uid;

//     if (entryMode === "manual") {
//       if (!form.category || !form.role || !form.location || !form.type || !form.pay || !form.description || !form.requirements) {
//         setError("All fields are required.");
//         return;
//       }

//       try {
//         setLoading(true);

//         // Add job description to the employer's jobDescriptions subcollection
//         await addDoc(collection(db, `Employers/${employerId}/jobDescriptions`), {
//           category: form.category,
//           role: form.role,
//           location: form.location,
//           type: form.type,
//           pay: form.pay,
//           description: form.description,
//           requirements: form.requirements,
//           priority: form.priority,
//           timestamp: new Date(),
//         });

//         alert("Job description uploaded successfully!");
//         navigate("/employer-dashboard");
//       } catch (error) {
//         console.error("Error adding document: ", error);
//         setError("Failed to upload job description.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     if (entryMode === "upload") {
//       if (!form.jdFile) {
//         setError("Please select a PDF file to upload.");
//         return;
//       }
//       // Handle file upload logic here, if you plan to store the file in Firebase Storage or similar.
//       alert("File upload logic needs to be implemented.");
//     }
//   };

//   const openFileDialog = () => {
//     fileInputRef.current.click();
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//       <Card className="w-full max-w-2xl">
//         <CardHeader>
//           <CardTitle>Upload Job Description</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div>
//               <label className="block mb-1 font-medium">Choose Entry Mode</label>
//               <div className="flex gap-4">
//                 <label>
//                   <input type="radio" name="entryMode" value="manual" checked={entryMode === "manual"} onChange={() => setEntryMode("manual")} />
//                   Enter Manually
//                 </label>
//                 <label>
//                   <input type="radio" name="entryMode" value="upload" checked={entryMode === "upload"} onChange={() => setEntryMode("upload")} />
//                   Upload JD File
//                 </label>
//               </div>
//             </div>

//             {entryMode === "manual" && (
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block mb-1 font-medium">Category</label>
//                   <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
//                     <option value="">Select Category</option>
//                     {categories.map((cat) => (
//                       <option key={cat} value={cat}>{cat}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <input name="role" type="text" placeholder="Role Name" className="w-full border rounded px-3 py-2" value={form.role} onChange={handleChange} required />
//                 <input name="location" type="text" placeholder="Location" className="w-full border rounded px-3 py-2" value={form.location} onChange={handleChange} required />
//                 <div>
//                   <label className="block mb-1 font-medium">Type</label>
//                   <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
//                     <option value="">Select Type</option>
//                     {types.map((t) => (
//                       <option key={t} value={t}>{t}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <input name="pay" type="text" placeholder="Pay" className="w-full border rounded px-3 py-2" value={form.pay} onChange={handleChange} required />
//                 <textarea name="description" placeholder="Job Description" className="w-full border rounded px-3 py-2" value={form.description} onChange={handleChange} required rows={3} />
//                 <textarea name="requirements" placeholder="Requirements" className="w-full border rounded px-3 py-2" value={form.requirements} onChange={handleChange} required rows={2} />
//                 <div>
//                   <label className="block mb-1 font-medium">Requirement Priority Level</label>
//                   <select name="priority" value={form.priority} onChange={handleChange} className="w-full border rounded px-3 py-2">
//                     {priorities.map((p) => (
//                       <option key={p} value={p}>{p}</option>
//                     ))}
//                   </select>
//                 </div>
//                 {error && <div className="text-red-500 text-sm">{error}</div>}
//                 <div className="flex gap-4">
//                   <Button type="submit" className="w-full" disabled={loading}>
//                     {loading ? "Uploading..." : "Submit Job Description"}
//                   </Button>
//                   <Button type="button" className="w-full bg-green-600 text-white" onClick={() => navigate("/view-all-uploads")}>
//                     View All Uploads
//                   </Button>
//                 </div>
//               </form>
//             )}

//             {entryMode === "upload" && (
//               <div className="space-y-4">
//                 <input
//                   type="file"
//                   name="jdFile"
//                   accept=".pdf"
//                   onChange={handleChange}
//                   ref={fileInputRef}
//                   style={{ display: "none" }}
//                 />
//                 {error && <div className="text-red-500 text-sm">{error}</div>}
//                 <div className="flex gap-4">
//                   <Button type="button" className="w-full bg-blue-600 text-white" onClick={openFileDialog}>
//                     Choose JD File
//                   </Button>
//                   <Button type="button" className="w-full bg-blue-600 text-white" onClick={handleSubmit}>
//                     Upload & Submit
//                   </Button>
//                   <Button type="button" className="w-full bg-green-600 text-white" onClick={() => navigate("/view-all-uploads")}>
//                     View All Uploads
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default UploadJobDescription;
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuth } from "firebase/auth";
import { db } from "../firebase"; // Adjust the path if needed
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { extractJDFromBase64 } from "../services/extractJDService"; // Assume this is a local function

const UploadJobDescription = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ jdFile: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { files } = e.target;
    setForm({ jdFile: files[0] });
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Extract base64 string
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError("You must be logged in to upload a job description.");
      return;
    }

    const employerId = currentUser.uid;

    if (!form.jdFile) {
      setError("Please select a PDF file to upload.");
      return;
    }

    try {
      setLoading(true);

      // Convert file to Base64
      const base64String = await convertFileToBase64(form.jdFile);

      // Store the Base64 string in Firestore
      const docRef = await addDoc(collection(db, `Employers/${employerId}/jobDescriptions`), {
        base64: base64String,
        timestamp: new Date(),
      });

      alert("Job description uploaded and stored successfully!");

      // Process the uploaded JD
      await processJobDescription(employerId, docRef.id);

      // Navigate to dashboard
      navigate("/employer-dashboard");
    } catch (error) {
      console.error("Error storing document: ", error);
      setError("Failed to upload job description.");
    } finally {
      setLoading(false);
    }
  };

  const processJobDescription = async (employerId, jobId) => {
    try {
      // Fetch the document containing the Base64 PDF
      const docRef = doc(db, `Employers/${employerId}/jobDescriptions/${jobId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const base64String = docSnap.data().base64;

        // Process the Base64 string locally
        const extractedData = await extractJDFromBase64(base64String);

        // Update the Firestore document with extracted information
        await updateDoc(docRef, {
          ...extractedData,
          processedTimestamp: new Date(),
        });

        alert("Job description processed and updated successfully!");
      } else {
        console.error("Document does not exist.");
        throw new Error("Failed to fetch job description.");
      }
    } catch (error) {
      console.error("Error processing job description: ", error);
      setError("Failed to process job description.");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              name="jdFile"
              accept=".pdf"
              onChange={handleChange}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-4">
              <Button type="button" className="w-full bg-blue-600 text-white" onClick={openFileDialog}>
                Choose JD File
              </Button>
              <Button type="button" className="w-full bg-blue-600 text-white" onClick={handleUpload} disabled={loading}>
                {loading ? "Uploading..." : "Upload PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadJobDescription;
