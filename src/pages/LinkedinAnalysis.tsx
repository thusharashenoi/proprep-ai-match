import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

// Use the correct backend endpoint for the LinkedIn analysis HTML report
// const LINKEDIN_ANALYSIS_API = "http://localhost:3000/api/linkedin/report/linkedin_analysis.html";
const LINKEDIN_ANALYSIS_API = "https://linkedinanalyzerapi.onrender.com";
const LinkedinAnalysis: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the HTML file from the backend API
        const res = await fetch(LINKEDIN_ANALYSIS_API);
        if (!res.ok) throw new Error("Failed to fetch LinkedIn analysis HTML");
        const html = await res.text();
        setHtmlContent(html);
      } catch (err: any) {
        setError(err.message || "Error fetching LinkedIn analysis");
      } finally {
        setLoading(false);
      }
    };
    fetchHtml();
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
        // Extract the code inside the DOMContentLoaded handler
        const match = scriptText.match(/document.addEventListener\(['\"]DOMContentLoaded['\"], function\(\) \{([\s\S]*)\}\);?/);
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
      {/* pt-24 adds padding to push content below a fixed navbar (height ~6rem/24px) */}
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>LinkedIn Profile Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-blue-600">Loading LinkedIn analysis...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <div
              ref={containerRef}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedinAnalysis;
