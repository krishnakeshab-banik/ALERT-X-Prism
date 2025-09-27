import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLatestTrafficData = query({
  args: {
    cameraId: v.optional(v.id("cameras")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let data;
    
    if (args.cameraId) {
      data = await ctx.db
        .query("trafficData")
        .withIndex("by_camera", (q) => q.eq("cameraId", args.cameraId!))
        .order("desc")
        .take(100);
    } else {
      data = await ctx.db
        .query("trafficData")
        .order("desc")
        .take(100);
    }
    
    // Get camera details for each data point
    const dataWithCameras = await Promise.all(
      data.map(async (traffic) => {
        const camera = await ctx.db.get(traffic.cameraId);
        return {
          ...traffic,
          camera,
        };
      })
    );

    return dataWithCameras;
  },
});

export const getTrafficHeatmapData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get latest traffic data for each camera
    const cameras = await ctx.db.query("cameras").collect();
    const heatmapData = [];

    for (const camera of cameras) {
      const latestData = await ctx.db
        .query("trafficData")
        .withIndex("by_camera", (q) => q.eq("cameraId", camera._id))
        .order("desc")
        .first();

      if (latestData) {
        heatmapData.push({
          lat: camera.location.lat,
          lng: camera.location.lng,
          intensity: latestData.congestionLevel / 100,
          trafficIntensity: latestData.trafficIntensity,
          vehicleCount: latestData.vehicleCount,
          peopleCount: latestData.peopleCount,
          cameraName: camera.name,
          timestamp: latestData.timestamp,
        });
      }
    }

    return heatmapData;
  },
});

export const recordTrafficData = internalMutation({
  args: {
    cameraId: v.id("cameras"),
    vehicleCount: v.object({
      cars: v.number(),
      bikes: v.number(),
      trucks: v.number(),
      buses: v.number(),
    }),
    peopleCount: v.number(),
    trafficIntensity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    congestionLevel: v.number(),
    averageSpeed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trafficData", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getTrafficStats = query({
  args: {
    timeRange: v.optional(v.union(v.literal("1h"), v.literal("24h"), v.literal("7d"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const timeRange = args.timeRange || "24h";
    const now = Date.now();
    let startTime = now;

    switch (timeRange) {
      case "1h":
        startTime = now - (60 * 60 * 1000);
        break;
      case "24h":
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
    }

    const trafficData = await ctx.db
      .query("trafficData")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startTime))
      .collect();

    const totalVehicles = trafficData.reduce((sum, data) => {
      return sum + data.vehicleCount.cars + data.vehicleCount.bikes + 
             data.vehicleCount.trucks + data.vehicleCount.buses;
    }, 0);

    const totalPeople = trafficData.reduce((sum, data) => sum + data.peopleCount, 0);
    const avgCongestion = trafficData.length > 0 
      ? trafficData.reduce((sum, data) => sum + data.congestionLevel, 0) / trafficData.length
      : 0;

    return {
      totalVehicles,
      totalPeople,
      avgCongestion: Math.round(avgCongestion),
      dataPoints: trafficData.length,
      timeRange,
    };
  },
});

export const getRoutes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db.query("routes").collect();
  },
});

export const calculateRoute = query({
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
    if (!userId) return null;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (args.endLocation.lat - args.startLocation.lat) * Math.PI / 180;
    const dLng = (args.endLocation.lng - args.startLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(args.startLocation.lat * Math.PI / 180) * Math.cos(args.endLocation.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Calculate estimated time based on mode
    let estimatedTime = 0;
    let trafficDelay = 0;

    switch (args.mode) {
      case "car":
        estimatedTime = distance / 30; // 30 km/h average
        trafficDelay = Math.random() * 10; // Random traffic delay
        break;
      case "bike":
        estimatedTime = distance / 15; // 15 km/h average
        trafficDelay = Math.random() * 5;
        break;
      case "walk":
        estimatedTime = distance / 5; // 5 km/h average
        trafficDelay = 0;
        break;
      case "train":
        estimatedTime = distance / 40; // 40 km/h average
        trafficDelay = Math.random() * 15; // Train delays
        break;
    }

    // Generate waypoints (simplified)
    const waypoints = [];
    const numWaypoints = Math.max(2, Math.floor(distance / 2));
    for (let i = 1; i < numWaypoints; i++) {
      const ratio = i / numWaypoints;
      waypoints.push({
        lat: args.startLocation.lat + (args.endLocation.lat - args.startLocation.lat) * ratio,
        lng: args.startLocation.lng + (args.endLocation.lng - args.startLocation.lng) * ratio,
      });
    }

    return {
      startLocation: args.startLocation,
      endLocation: args.endLocation,
      mode: args.mode,
      distance: Math.round(distance * 100) / 100,
      estimatedTime: Math.round(estimatedTime * 60), // Convert to minutes
      trafficDelay: Math.round(trafficDelay),
      waypoints,
      lastUpdated: Date.now(),
    };
  },
});
