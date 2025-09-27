import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { TensorFlowDetector } from "./TensorFlowDetector";

interface CameraFeedProps {
  cameraId?: string;
  onIncidentDetected?: (incident: any) => void;
  isActive?: boolean;
}

export function CameraFeed({ cameraId, onIncidentDetected, isActive = true }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [detectionResults, setDetectionResults] = useState<any>(null);
  
  const analyzeFrame = useMutation(api.analysis.analyzeTrafficFrame);

  useEffect(() => {
    if (!isActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment"
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
          setError(null);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please check permissions.");
        toast.error("Camera access denied");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleDetection = (result: any) => {
    setDetectionResults(result);
    
    if (result.incidents && result.incidents.length > 0) {
      setIncidents(prev => [...prev, ...result.incidents]);
      result.incidents.forEach((incident: any) => {
        if (onIncidentDetected) {
          onIncidentDetected(incident);
        }
      });
    }
  };

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-red-400 text-4xl mb-4">📷</div>
        <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          {isStreaming ? "🔴 LIVE" : "⏸️ Offline"}
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          AI Analysis: {isStreaming ? "Active" : "Inactive"}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* TensorFlow Detection Results */}
      <TensorFlowDetector
        videoRef={videoRef}
        onDetection={handleDetection}
        isActive={isStreaming}
      />

      {incidents.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-red-400">Recent Incidents Detected</h4>
          <div className="space-y-2">
            {incidents.slice(-3).map((incident, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="text-lg">
                  {incident.type === "fire" ? "🔥" : 
                   incident.type === "accident" ? "🚗💥" : 
                   incident.type === "crowd" ? "👥" : "⚠️"}
                </span>
                <span className="text-gray-300">
                  {incident.type.replace("_", " ").toUpperCase()}
                </span>
                <span className="text-gray-500">
                  ({Math.round(incident.confidence * 100)}% confidence)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
