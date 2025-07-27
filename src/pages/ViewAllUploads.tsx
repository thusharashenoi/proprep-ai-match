import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { X } from "lucide-react";

interface JobSummary {
  id: string;
  role: string;
  priority: string;
}

interface FullJobDetails extends JobSummary {
  category?: string;
  description?: string;
  location?: string;
  pay?: string;
  requirements?: string;
  timestamp?: any;
  type?: string;
}

const ViewAllUploads = () => {
  const [uploads, setUploads] = useState<JobSummary[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<FullJobDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [employerId, setEmployerId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⚠️ User not logged in");
        setLoading(false);
        return;
      }

      const uid = user.uid;
      setEmployerId(uid);

      try {
        // ✅ Fetch profile image from correct field: profilePic
        const employerDocRef = doc(db, "Employers", uid);
        const employerSnap = await getDoc(employerDocRef);

        if (employerSnap.exists()) {
          const data = employerSnap.data();
          setProfileImage(data.profilePic || null);
        }

        // Fetch job summaries
        const jdsRef = collection(db, "Employers", uid, "jobDescriptions");
        const snapshot = await getDocs(jdsRef);

        const jobs: JobSummary[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<JobSummary, "id">),
        }));

        setUploads(jobs);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleJobClick = async (jobId: string) => {
    if (!employerId) return;

    setModalLoading(true);
    const jobRef = doc(db, "Employers", employerId, "jobDescriptions", jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
      const jobData = jobSnap.data() as Omit<FullJobDetails, "id">;
      setSelectedJob({ id: jobId, ...jobData });
    } else {
      console.warn("⚠️ No job found with ID:", jobId);
    }

    setModalLoading(false);
  };

  const closeModal = () => setSelectedJob(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 flex flex-col items-center px-4">
      <Card className="w-full max-w-6xl p-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold mb-6">
            All Uploaded Job Descriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-center text-gray-500 text-lg font-medium">
              No job descriptions uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {uploads.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center cursor-pointer hover:shadow-xl transition duration-200"
                >
                  <img
                    src={profileImage || "https://via.placeholder.com/150"}
                    alt="Employer Profile"
                    className="w-20 h-20 rounded-full mb-4 object-cover border-2 border-indigo-400"
                  />
                  <div className="font-bold text-lg text-center text-gray-800 mb-2">
                    {job.role}
                  </div>
                  <div
                    className={`text-sm font-semibold text-center ${
                      job.priority === "High"
                        ? "text-red-600"
                        : job.priority === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {job.priority} Priority
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔍 Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl relative shadow-lg max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-500"
            >
              <X size={24} />
            </button>

            {modalLoading ? (
  <p className="text-center text-gray-500">Loading details...</p>
) : (
  <>
    <h2 className="text-2xl font-bold mb-2">{selectedJob.role}</h2>
    <p className="text-sm mb-4 text-gray-600">{selectedJob.location}</p>

    <div className="space-y-2 text-sm text-gray-700">
      {/* Existing details */}
      <p>
        <span className="font-semibold">Category:</span>{" "}
        {selectedJob.category || "N/A"}
      </p>
      <p>
        <span className="font-semibold">Type:</span>{" "}
        {selectedJob.type || "N/A"}
      </p>
      <p>
        <span className="font-semibold">Priority:</span>{" "}
        <span
          className={`font-semibold ${
            selectedJob.priority === "High"
              ? "text-red-600"
              : selectedJob.priority === "Medium"
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {selectedJob.priority}
        </span>
      </p>
      {selectedJob.pay && (
        <p>
          <span className="font-semibold">Pay:</span> {selectedJob.pay}
        </p>
      )}
      <div>
        <p className="font-semibold mb-1">Description:</p>
        <p className="whitespace-pre-line">{selectedJob.description || "No description provided."}</p>
      </div>
      <div>
        <p className="font-semibold mb-1">Requirements:</p>
        <p className="whitespace-pre-line">{selectedJob.requirements || "Not specified."}</p>
      </div>
    </div>

    {/* ✅ Close Request Button */}
    <div className="mt-6 flex justify-end">
      <button
        onClick={async () => {
          if (!employerId || !selectedJob?.id) return;

          try {
            const jobRef = doc(db, "Employers", employerId, "jobDescriptions", selectedJob.id);
            await updateDoc(jobRef, { tagline: "Not accepting responses" });

            // Optional: Update local state to reflect the change
            setSelectedJob((prev) =>
              prev ? { ...prev, tagline: "Not accepting responses" } : prev
            );

            alert("✅ Job marked as 'Not accepting responses'");
          } catch (err) {
            console.error("Error closing request:", err);
            alert("❌ Failed to close request");
          }
        }}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Close Request
      </button>
    </div>
  </>
)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAllUploads;
