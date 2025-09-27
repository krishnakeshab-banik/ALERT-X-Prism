import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  cameras: defineTable({
    name: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance")),
    type: v.union(v.literal("government"), v.literal("private")),
    ownerId: v.optional(v.id("users")),
    operationalHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
    lastAnalysis: v.optional(v.number()),
  }).index("by_type", ["type"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  incidents: defineTable({
    cameraId: v.id("cameras"),
    type: v.union(
      v.literal("accident"),
      v.literal("fire"),
      v.literal("crowd"),
      v.literal("unauthorized_movement"),
      v.literal("traffic_jam")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("unresolved")),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    description: v.string(),
    confidence: v.number(),
    assignedTo: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    notificationsSent: v.boolean(),
  }).index("by_camera", ["cameraId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_severity", ["severity"]),

  trafficData: defineTable({
    cameraId: v.id("cameras"),
    timestamp: v.number(),
    vehicleCount: v.object({
      cars: v.number(),
      bikes: v.number(),
      trucks: v.number(),
      buses: v.number(),
    }),
    peopleCount: v.number(),
    trafficIntensity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    averageSpeed: v.optional(v.number()),
    congestionLevel: v.number(), // 0-100
  }).index("by_camera", ["cameraId"])
    .index("by_timestamp", ["timestamp"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("government"), v.literal("public"), v.literal("private")),
    organization: v.optional(v.string()),
    permissions: v.array(v.string()),
    preferences: v.object({
      notifications: v.boolean(),
      alertTypes: v.array(v.string()),
    }),
  }).index("by_user", ["userId"])
    .index("by_role", ["role"]),

  alerts: defineTable({
    incidentId: v.id("incidents"),
    recipientId: v.id("users"),
    type: v.string(),
    message: v.string(),
    sent: v.boolean(),
    readAt: v.optional(v.number()),
  }).index("by_recipient", ["recipientId"])
    .index("by_incident", ["incidentId"]),

  routes: defineTable({
    startLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    endLocation: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    mode: v.union(v.literal("car"), v.literal("bike"), v.literal("walk"), v.literal("train")),
    distance: v.number(),
    estimatedTime: v.number(),
    trafficDelay: v.number(),
    waypoints: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    lastUpdated: v.number(),
  }).index("by_mode", ["mode"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
