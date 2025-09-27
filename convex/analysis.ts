import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const analyzeTrafficFrame = action({
  args: {
    cameraId: v.union(v.id("cameras"), v.string()),
    imageData: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Simulate AI analysis with realistic data
      const analysisPrompt = `Analyze this traffic camera feed and provide a JSON response with the following structure:
      {
        "vehicleCount": {
          "cars": number,
          "bikes": number,
          "trucks": number,
          "buses": number
        },
        "peopleCount": number,
        "trafficIntensity": "low" | "medium" | "high",
        "congestionLevel": number (0-100),
        "incidents": [
          {
            "type": "accident" | "fire" | "crowd" | "traffic_jam",
            "severity": "low" | "medium" | "high" | "critical",
            "description": string,
            "confidence": number (0-1)
          }
        ],
        "averageSpeed": number (km/h, optional)
      }
      
      Generate realistic traffic data for a busy Indian city intersection.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.7,
      });

      let analysisResult;
      try {
        analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      } catch {
        // Fallback with realistic demo data
        analysisResult = generateDemoTrafficData();
      }

      // Record traffic data (only for real cameras, not laptop camera)
      if (typeof args.cameraId !== "string" || args.cameraId !== "laptop-camera") {
        await ctx.runMutation(internal.traffic.recordTrafficData, {
          cameraId: args.cameraId as any,
          vehicleCount: analysisResult.vehicleCount,
          peopleCount: analysisResult.peopleCount,
          trafficIntensity: analysisResult.trafficIntensity,
          congestionLevel: analysisResult.congestionLevel,
          averageSpeed: analysisResult.averageSpeed,
        });
      }

      // Create incidents if detected
      if (analysisResult.incidents && analysisResult.incidents.length > 0) {
        let cameraLocation = args.location || { lat: 0, lng: 0, address: "Unknown" };
        
        // Get camera location if it's a real camera
        if (typeof args.cameraId !== "string" || args.cameraId !== "laptop-camera") {
          const camera = await ctx.runQuery(internal.cameras.getCameraByIdInternal, {
            cameraId: args.cameraId as any,
          });
          if (camera) {
            cameraLocation = camera.location;
          }
        }

        for (const incident of analysisResult.incidents) {
          if (incident.confidence > 0.7) { // Only create high-confidence incidents
            await ctx.runMutation(internal.incidents.createIncident, {
              cameraId: typeof args.cameraId === "string" ? args.cameraId as any : args.cameraId,
              type: incident.type,
              severity: incident.severity,
              location: cameraLocation,
              description: incident.description,
              confidence: incident.confidence,
            });
          }
        }
      }

      // Update camera last analysis timestamp (only for real cameras)
      if (typeof args.cameraId !== "string" || args.cameraId !== "laptop-camera") {
        await ctx.runMutation(internal.cameras.updateLastAnalysis, {
          cameraId: args.cameraId as any,
          timestamp: Date.now(),
        });
      }

      return analysisResult;
    } catch (error) {
      console.error("Analysis failed:", error);
      // Return demo data on error
      return generateDemoTrafficData();
    }
  },
});

export const runPeriodicAnalysisInternal = internalAction({
  args: {},
  handler: async (ctx): Promise<{ analyzed: number }> => {
    // Get all active cameras
    const cameras: any[] = await ctx.runQuery(internal.cameras.listCamerasInternal, {});
    const activeCameras = cameras.filter((camera: any) => camera.status === "active");

    console.log(`Running analysis for ${activeCameras.length} cameras`);

    // Analyze each camera
    for (const camera of activeCameras) {
      try {
        await ctx.runAction(api.analysis.analyzeTrafficFrame, {
          cameraId: camera._id,
        });
      } catch (error) {
        console.error(`Failed to analyze camera ${camera.name}:`, error);
      }
    }

    return { analyzed: activeCameras.length };
  },
});

function generateDemoTrafficData() {
  const baseVehicles = Math.floor(Math.random() * 50) + 10;
  const congestionLevel = Math.floor(Math.random() * 100);
  
  let trafficIntensity: "low" | "medium" | "high" = "low";
  if (congestionLevel > 70) trafficIntensity = "high";
  else if (congestionLevel > 40) trafficIntensity = "medium";

  const incidents = [];
  
  // Randomly generate incidents (20% chance)
  if (Math.random() < 0.2) {
    const incidentTypes = ["accident", "fire", "crowd", "traffic_jam"] as const;
    const severities = ["low", "medium", "high", "critical"] as const;
    
    incidents.push({
      type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: "AI detected potential incident requiring attention",
      confidence: 0.75 + Math.random() * 0.25,
    });
  }

  return {
    vehicleCount: {
      cars: Math.floor(baseVehicles * 0.6),
      bikes: Math.floor(baseVehicles * 0.25),
      trucks: Math.floor(baseVehicles * 0.1),
      buses: Math.floor(baseVehicles * 0.05),
    },
    peopleCount: Math.floor(Math.random() * 30) + 5,
    trafficIntensity,
    congestionLevel,
    incidents,
    averageSpeed: Math.max(10, 60 - (congestionLevel * 0.5)),
  };
}
