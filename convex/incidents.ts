import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listIncidents = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"), v.literal("unresolved"))),
    type: v.optional(v.union(
      v.literal("accident"),
      v.literal("fire"),
      v.literal("crowd"),
      v.literal("unauthorized_movement"),
      v.literal("traffic_jam")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let incidents;
    
    if (args.status) {
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_status", (q) => q.eq("status", args.status as "pending" | "resolved" | "unresolved"))
        .order("desc")
        .take(50);
    } else {
      incidents = await ctx.db
        .query("incidents")
        .order("desc")
        .take(50);
    }
    
    // Get camera details for each incident
    const incidentsWithCameras = await Promise.all(
      incidents.map(async (incident) => {
        const camera = await ctx.db.get(incident.cameraId);
        return {
          ...incident,
          camera,
        };
      })
    );

    return incidentsWithCameras;
  },
});

export const getIncidentById = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) return null;

    const camera = await ctx.db.get(incident.cameraId);
    return {
      ...incident,
      camera,
    };
  },
});

export const createIncident = internalMutation({
  args: {
    cameraId: v.id("cameras"),
    type: v.union(
      v.literal("accident"),
      v.literal("fire"),
      v.literal("crowd"),
      v.literal("unauthorized_movement"),
      v.literal("traffic_jam")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    description: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incidents", {
      ...args,
      status: "pending",
      notificationsSent: false,
    });
  },
});

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("unresolved")),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: any = {
      status: args.status,
    };

    if (args.assignedTo) {
      updates.assignedTo = args.assignedTo;
    }

    if (args.status === "resolved") {
      updates.resolvedAt = Date.now();
    }

    await ctx.db.patch(args.incidentId, updates);
  },
});

export const getIncidentStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const allIncidents = await ctx.db.query("incidents").collect();
    
    const stats = {
      total: allIncidents.length,
      pending: allIncidents.filter(i => i.status === "pending").length,
      resolved: allIncidents.filter(i => i.status === "resolved").length,
      unresolved: allIncidents.filter(i => i.status === "unresolved").length,
      byType: {
        accident: allIncidents.filter(i => i.type === "accident").length,
        fire: allIncidents.filter(i => i.type === "fire").length,
        crowd: allIncidents.filter(i => i.type === "crowd").length,
        unauthorized_movement: allIncidents.filter(i => i.type === "unauthorized_movement").length,
        traffic_jam: allIncidents.filter(i => i.type === "traffic_jam").length,
      },
      bySeverity: {
        low: allIncidents.filter(i => i.severity === "low").length,
        medium: allIncidents.filter(i => i.severity === "medium").length,
        high: allIncidents.filter(i => i.severity === "high").length,
        critical: allIncidents.filter(i => i.severity === "critical").length,
      },
    };

    return stats;
  },
});
