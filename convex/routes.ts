import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const calculateRoute = mutation({
  args: {
    startLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    endLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    mode: v.union(v.literal("car"), v.literal("bike"), v.literal("walk"), v.literal("train")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current traffic data to calculate optimal route
    const trafficData = await ctx.db.query("trafficData").order("desc").take(50);
    
    // Simple route calculation (in a real app, this would use a routing service)
    const distance = calculateDistance(args.startLocation, args.endLocation);
    const baseTime = calculateBaseTime(distance, args.mode);
    const trafficDelay = calculateTrafficDelay(trafficData, args.mode);
    
    const route = {
      startLocation: args.startLocation,
      endLocation: args.endLocation,
      mode: args.mode,
      distance,
      estimatedTime: baseTime + trafficDelay,
      trafficDelay,
      waypoints: generateWaypoints(args.startLocation, args.endLocation),
      lastUpdated: Date.now(),
    };

    const routeId = await ctx.db.insert("routes", route);
    
    return {
      ...route,
      _id: routeId,
    };
  },
});

export const getRouteAlternatives = query({
  args: {
    startLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    endLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const modes = ["car", "bike", "walk", "train"] as const;
    const routes = [];

    for (const mode of modes) {
      const distance = calculateDistance(args.startLocation, args.endLocation);
      const baseTime = calculateBaseTime(distance, mode);
      const trafficData = await ctx.db.query("trafficData").order("desc").take(20);
      const trafficDelay = calculateTrafficDelay(trafficData, mode);

      routes.push({
        mode,
        distance,
        estimatedTime: baseTime + trafficDelay,
        trafficDelay,
        waypoints: generateWaypoints(args.startLocation, args.endLocation),
        lastUpdated: Date.now(),
      });
    }

    return routes.sort((a, b) => a.estimatedTime - b.estimatedTime);
  },
});

function calculateDistance(start: { lat: number; lng: number }, end: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in km
  const dLat = (end.lat - start.lat) * Math.PI / 180;
  const dLng = (end.lng - start.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateBaseTime(distance: number, mode: "car" | "bike" | "walk" | "train"): number {
  const speeds = {
    car: 40, // km/h in city traffic
    bike: 15, // km/h
    walk: 5, // km/h
    train: 50, // km/h average including stops
  };
  
  return (distance / speeds[mode]) * 60; // Convert to minutes
}

function calculateTrafficDelay(trafficData: any[], mode: "car" | "bike" | "walk" | "train"): number {
  if (mode === "walk") return 0; // Walking not affected by traffic
  
  const avgCongestion = trafficData.length > 0
    ? trafficData.reduce((sum, data) => sum + data.congestionLevel, 0) / trafficData.length
    : 0;
  
  const delayMultipliers = {
    car: 1.0,
    bike: 0.3,
    train: 0.1,
    walk: 0,
  };
  
  return (avgCongestion / 100) * 30 * delayMultipliers[mode]; // Max 30 min delay for cars
}

function generateWaypoints(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  // Generate simple waypoints (in a real app, this would use a routing service)
  const waypoints = [];
  const steps = 3;
  
  for (let i = 1; i < steps; i++) {
    const ratio = i / steps;
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }
  
  return waypoints;
}
