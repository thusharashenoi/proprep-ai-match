import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const EmployeeProfile = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-semibold text-red-600 mb-2">Unable to load profile</p>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">PP</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-sm text-gray-600">Manage your professional information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Personal Info Card */}
        <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-32 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <CardContent className="relative -mt-16 p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="relative">
                <img
                  src={
                    data.profilePic
                      ? `data:image/jpeg;base64,${data.profilePic}`
                      : "/default-avatar.png"
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-xs text-white">✓</span>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-3">
                <h2 className="text-3xl font-bold text-gray-800">{data.name}</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className="text-blue-600">📧</span>
                    <p className="text-gray-700">{data.email}</p>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className="text-green-600">📱</span>
                    <p className="text-gray-700">{data.phone}</p>
                  </div>
                  {data.linkedin && (
                    <div className="flex items-center justify-center md:justify-start space-x-2">
                      <span className="text-blue-700">💼</span>
                      <a
                        href={data.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Experience */}
            {data.experience?.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-white/20">
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <span className="text-2xl">💼</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Experience
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {data.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{exp.company}</h3>
                          {exp.location && (
                            <span className="text-sm text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                              📍 {exp.location}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-medium text-blue-600 mb-1">{exp.role}</p>
                        {exp.duration && (
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            <span className="mr-1">🕒</span> {exp.duration}
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {data.education?.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-white/20">
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <span className="text-2xl">🎓</span>
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Education
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {data.education.map((edu: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{edu.institution}</h3>
                        {edu.location && (
                          <span className="text-sm text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                            📍 {edu.location}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-medium text-green-600 mb-2">{edu.degree}</p>
                      <div className="flex flex-wrap gap-3">
                        {edu.grade && (
                          <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                            🏆 Score: {edu.grade}
                          </span>
                        )}
                        {edu.subject && (
                          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            📚 {edu.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Skills */}
            {data.skills?.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-white/20">
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <span className="text-2xl">⚡</span>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Skills
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm font-medium px-4 py-2 rounded-full hover:shadow-md transition-all duration-200 cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {data.certifications?.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-white/20">
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <span className="text-2xl">🏅</span>
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Certifications
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {data.certifications.map((cert: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                      >
                        <span className="text-orange-600">🎖️</span>
                        <span className="text-gray-800 font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            Edit Profile
          </button>
          <button className="bg-white/70 backdrop-blur-sm border border-white/20 text-gray-700 px-8 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
            Download Resume
          </button>
          <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            Share Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;