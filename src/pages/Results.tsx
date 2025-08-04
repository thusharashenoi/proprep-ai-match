import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ResumeAnalysisPage() {
  const location = useLocation();
  const resumeAnalysis = location.state?.resumeAnalysis;

  const subscores = resumeAnalysis?.atsSubscoresNormalized;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Tabs defaultValue="ats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ats">ATS Analysis</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="ats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ATS Compatibility Score</CardTitle>
              <CardDescription>
                This score reflects how well your resume aligns with ATS standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center mb-4">
                {resumeAnalysis?.atsScore ?? "N/A"}%
              </div>
              <Progress value={resumeAnalysis?.atsScore ?? 0} className="h-4" />
            </CardContent>
          </Card>

          {/* ✅ Subscores section */}
          {subscores && (
            <Card>
              <CardHeader>
                <CardTitle>ATS Subscores</CardTitle>
                <CardDescription>
                  Detailed breakdown of resume evaluation criteria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Content Quality</p>
                  <Progress value={subscores.contentQuality ?? 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscores.contentQuality ?? 0}/100
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Visual Design</p>
                  <Progress value={subscores.visualDesign ?? 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscores.visualDesign ?? 0}/100
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Readability</p>
                  <Progress value={subscores.readability ?? 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscores.readability ?? 0}/100
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Technical Compliance</p>
                  <Progress value={subscores.technicalCompliance ?? 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscores.technicalCompliance ?? 0}/100
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Summary</CardTitle>
              <CardDescription>
                Key highlights and potential improvements for your resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {resumeAnalysis?.summary?.map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                )) ?? <li>No summary available</li>}
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Link to="/dashboard">
              <Button variant="default">Back to Dashboard</Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
