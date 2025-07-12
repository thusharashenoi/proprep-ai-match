import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const categories = ["Data Science", "AI", "Electrical", "Software", "Mechanical", "Finance", "Marketing"];
const types = ["Full Time", "Internship", "Part Time", "Contract"];
const priorities = ["High", "Medium", "Low"];

const UploadJobDescription = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: "",
    role: "",
    location: "",
    type: "",
    pay: "",
    description: "",
    requirements: "",
    priority: "Medium",
  });
  const [error, setError] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save job description to backend
    if (!form.category || !form.role || !form.location || !form.type || !form.pay || !form.description || !form.requirements) {
      setError("All fields are required.");
      return;
    }
    setError("");
    // Simulate success
    alert("Job description uploaded successfully!");
    navigate("/employer-dashboard");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <input name="role" type="text" placeholder="Role Name" className="w-full border rounded px-3 py-2" value={form.role} onChange={handleChange} required />
            <input name="location" type="text" placeholder="Location" className="w-full border rounded px-3 py-2" value={form.location} onChange={handleChange} required />
            <div>
              <label className="block mb-1 font-medium">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
                <option value="">Select Type</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <input name="pay" type="text" placeholder="Pay" className="w-full border rounded px-3 py-2" value={form.pay} onChange={handleChange} required />
            <textarea name="description" placeholder="Job Description" className="w-full border rounded px-3 py-2" value={form.description} onChange={handleChange} required rows={3} />
            <textarea name="requirements" placeholder="Requirements" className="w-full border rounded px-3 py-2" value={form.requirements} onChange={handleChange} required rows={2} />
            <div>
              <label className="block mb-1 font-medium">Requirement Priority Level</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full border rounded px-3 py-2">
                {priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-4">
              <Button type="submit" className="w-full">Submit</Button>
              <Button type="button" className="w-full bg-green-600 text-white" onClick={() => navigate("/view-all-uploads")}>View All Uploads</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadJobDescription;
