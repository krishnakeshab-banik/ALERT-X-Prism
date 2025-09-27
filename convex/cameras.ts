import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const listCameras = query({
  args: {
    type: v.optional(v.union(v.literal("government"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let cameras;
    
    if (args.type) {
      cameras = await ctx.db
        .query("cameras")
        .withIndex("by_type", (q) => q.eq("type", args.type as "government" | "private"))
        .collect();
    } else {
      cameras = await ctx.db.query("cameras").collect();
    }

    // Filter private cameras to only show user's own cameras
    if (args.type === "private") {
      return cameras.filter(camera => camera.ownerId === userId);
    }
    
    return cameras;
  },
});

export const getCameraById = query({
  args: { cameraId: v.id("cameras") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cameraId);
  },
});

export const getCameraByIdInternal = internalQuery({
  args: { cameraId: v.id("cameras") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cameraId);
  },
});

export const listCamerasInternal = internalQuery({
  args: {
    type: v.optional(v.union(v.literal("government"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    let cameras;
    
    if (args.type) {
      cameras = await ctx.db
        .query("cameras")
        .withIndex("by_type", (q) => q.eq("type", args.type as "government" | "private"))
        .collect();
    } else {
      cameras = await ctx.db.query("cameras").collect();
    }
    
    return cameras;
  },
});

export const addCamera = mutation({
  args: {
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    type: v.union(v.literal("government"), v.literal("private")),
    operationalHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("cameras", {
      ...args,
      status: "active",
      ownerId: args.type === "private" ? userId : undefined,
    });
  },
});

export const updateCameraStatus = mutation({
  args: {
    cameraId: v.id("cameras"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.cameraId, {
      status: args.status,
    });
  },
});

export const updateLastAnalysis = internalMutation({
  args: {
    cameraId: v.id("cameras"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      lastAnalysis: args.timestamp,
    });
  },
});

// Initialize demo cameras with enhanced data
export const initializeDemoCameras = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate comprehensive dummy data
    await ctx.runMutation(internal.dummyData.generateDummyCameras, {});
    await ctx.runMutation(internal.dummyData.generateDummyTrafficData, {});
    await ctx.runMutation(internal.dummyData.generateDummyIncidents, {});

    return { success: true, message: "Demo cameras and data initialized" };
  },
});
