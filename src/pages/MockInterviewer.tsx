import React, { useEffect, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/GenAILiveClient";
import { LiveClientOptions } from "../types";
import { Modality } from "@google/genai";

const API_KEY = "AIzaSyBg5__RmySYRn3eTNtgd0nn1goaEgZSgjU"; // Replace with your Gemini API key
const MODEL_NAME = "models/gemini-2.0-flash-exp";

const PROMPT = "To converse with the human and answer questions based on the real-time video feed.";

export default function MockInterviewer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [client, setClient] = useState<GenAILiveClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const audioInputRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let genaiClient: GenAILiveClient | null = null;
    let videoStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;
    let interval: NodeJS.Timeout | null = null;

    // Get video and audio
    Promise.all([
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }),
      navigator.mediaDevices.getUserMedia({ audio: true })
    ]).then(([mediaStream, audioMediaStream]) => {
      videoStream = mediaStream;
      audioStream = audioMediaStream;
      audioInputRef.current = audioMediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      // Setup Gemini client
      const options: LiveClientOptions = { apiKey: API_KEY };
      genaiClient = new GenAILiveClient(options);

      genaiClient.on("audio", (audioBuffer) => {
        // Play Gemini's voice response
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createBufferSource();
        audioCtx.decodeAudioData(audioBuffer.slice(0), (buffer) => {
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start(0);
        });
      });
      genaiClient.on("open", () => setIsConnected(true));
      genaiClient.on("close", () => setIsConnected(false));

      // Connect to Gemini with text and audio response modalities
      genaiClient.connect(MODEL_NAME, {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: PROMPT }] },
      });

      setClient(genaiClient);

      // Send video frames every second
      interval = setInterval(() => {
        if (videoRef.current && genaiClient && isConnected) {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const data = canvas.toDataURL("image/jpeg").split(",")[1];
            genaiClient.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
          }
        }
      }, 1000);

      // Send audio chunks (improved implementation for PCM)
      if (audioStream) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(audioStream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioCtx.destination);
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          // Convert Float32Array to PCM 16-bit
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32767));
          }
          // Convert to base64
          const bytes = new Uint8Array(pcm.buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = window.btoa(binary);
          genaiClient?.sendRealtimeInput([{ mimeType: "audio/pcm", data: base64 }]);
        };
      }
    }).catch((err) => {
      // Show error in UI (use alert for now)
      alert("Unable to access camera or microphone: " + err.message);
    });

    return () => {
      if (interval) clearInterval(interval);
      if (genaiClient) genaiClient.disconnect();
      if (videoStream) videoStream.getTracks().forEach((track) => track.stop());
      if (audioStream) audioStream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      <div className="w-full max-w-2xl mx-auto p-6 rounded-xl shadow-2xl bg-white border border-gray-200 flex flex-col items-center justify-center" style={{ margin: '32px' }}>
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Mock Interviewer (Gemini 2.0 Flash)</h1>
        <video ref={videoRef} autoPlay playsInline className="rounded-xl border shadow-lg mb-6" style={{ width: '100%', maxWidth: '480px', height: '360px', objectFit: 'cover', margin: '16px' }} />
        {/* No text input/output bar below, only video and voice */}
        <div className="mt-8 w-full flex justify-center">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            onClick={() => window.location.href = '/interview-report'}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
