import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const EmployeeProfile = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true); // explicitly track loading

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "Employees", user.uid);
        const resumeRef = doc(db, "Employees", user.uid, "resume", "ParsedData");

        const [profileSnap, resumeSnap] = await Promise.all([
          getDoc(profileRef),
          getDoc(resumeRef),
        ]);

        if (profileSnap.exists() && resumeSnap.exists()) {
          const profileData = profileSnap.data();
          const resumeData = resumeSnap.data();
          setData({ ...profileData, ...resumeData });
        } else {
          console.log("Missing profile or resume data.");
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading resume info...</p>;

  if (!data) return <p className="text-center mt-10 text-red-500">Unable to load profile.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-8 px-4">
      {/* Personal Info */}
      <Card className="flex flex-col md:flex-row items-center p-6 shadow-md">
        <img
          src={
            data.profilePic
              ? `data:image/jpeg;base64,${data.profilePic}`
              : "/default-avatar.png"
          }
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border"
        />
        <div className="md:ml-6 mt-4 md:mt-0 space-y-1">
          <h2 className="text-xl font-semibold">{data.name}</h2>
          <p><strong>Email:</strong> {data.email}</p>
          <p><strong>Phone:</strong> {data.phone}</p>
          {data.linkedin && (
            <p>
              <strong>LinkedIn:</strong>{" "}
              <a
                href={data.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {data.linkedin}
              </a>
            </p>
          )}
        </div>
      </Card>

      {/* Education */}
      {data.education?.length > 0 && (
        <Card className="p-6 shadow-md">
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="border-b pb-2">
                <p className="text-lg font-semibold">
                  {edu.institution} {edu.location && `| ${edu.location}`}
                </p>
                <p className="text-md font-medium text-gray-800">{edu.degree}</p>
                {edu.grade && (
                  <p className="text-sm text-gray-500">🎓 Score: {edu.grade}</p>
                )}
                {edu.subject && (
                  <p className="text-sm text-gray-700">📘 Subject: {edu.subject}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <Card className="p-6 shadow-md">
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="border-b pb-2">
                <p className="text-lg font-semibold">
                  {exp.company} {exp.location && `| ${exp.location}`}
                </p>
                <p className="text-md font-medium text-gray-800">{exp.role}</p>
                {exp.duration && (
                  <p className="text-sm text-gray-500">🕒 {exp.duration}</p>
                )}
                {exp.description && (
                  <p className="text-gray-700 mt-1">{exp.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {data.skills?.length > 0 && (
        <Card className="p-6 shadow-md">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 mt-2">
            {data.skills.map((skill: string, idx: number) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {data.certifications?.length > 0 && (
        <Card className="p-6 shadow-md">
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent className="list-disc list-inside space-y-1 mt-2">
            {data.certifications.map((cert: string, idx: number) => (
              <li key={idx}>{cert}</li>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeProfile;
