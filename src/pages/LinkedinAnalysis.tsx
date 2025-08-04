import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const LinkedinAnalysis: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLinkedInAnalysis = async () => {
      setLoading(true);
      setError("");
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) throw new Error("User not logged in");

        // Get the most recent LinkedIn analysis from Firebase
        const analysisCollectionRef = collection(db, "Employees", user.uid, "linkedin_analysis");
        const analysisQuery = query(analysisCollectionRef, orderBy("analyzedAt", "desc"), limit(1));
        const analysisSnapshot = await getDocs(analysisQuery);

        if (analysisSnapshot.empty) {
          throw new Error("No LinkedIn analysis found. Please run an analysis first.");
        }

        const latestAnalysis = analysisSnapshot.docs[0].data();
        const reportUrl = latestAnalysis.reportUrl;

        if (!reportUrl) {
          throw new Error("Report URL not found in analysis data");
        }

        // Construct the full URL for the report
        // Assuming your backend is running on localhost:3000
        const fullReportUrl = `https://linkedinanalyzerapi-htmq.onrender.com${reportUrl}`;
        
        // Fetch the HTML content from the report URL
        const res = await fetch(fullReportUrl);
        if (!res.ok) throw new Error(`Failed to fetch LinkedIn analysis HTML: ${res.statusText}`);
        
        const html = await res.text();
        setHtmlContent(html);

      } catch (err: any) {
        console.error("Error fetching LinkedIn analysis:", err);
        setError(err.message || "Error fetching LinkedIn analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedInAnalysis();
  }, []);

  // Inject scripts after HTML is rendered
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;

    // Remove any previous scripts
    const prevScripts = containerRef.current.querySelectorAll("script[data-injected='true']");
    prevScripts.forEach(s => s.remove());

    // Extract and inject scripts
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = htmlContent;
    const scripts = doc.querySelectorAll("script");

    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      let scriptText = oldScript.textContent || "";

      // Patch: If script uses DOMContentLoaded, strip the wrapper and run immediately
      if (scriptText.includes('DOMContentLoaded')) {
        const match = scriptText.match(/document.addEventListener\(['"]DOMContentLoaded['"], function\(\) \{([\s\S]*)\}\);?/);
        if (match && match[1]) {
          scriptText = match[1];
        }
      }

      // Wrap in setTimeout to ensure DOM is ready and React has flushed
      newScript.textContent = `setTimeout(function(){${scriptText}}, 0);`;
      newScript.async = false;
      newScript.setAttribute("data-injected", "true");
      containerRef.current!.appendChild(newScript);
    });
  }, [htmlContent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4 pt-24">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>LinkedIn Profile Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-blue-600">Loading LinkedIn analysis...</div>
            </div>
          )}
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          {!loading && !error && htmlContent && (
            <div
              ref={containerRef}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
          {!loading && !error && !htmlContent && (
            <div className="text-gray-600 p-4">
              No analysis content available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedinAnalysis;