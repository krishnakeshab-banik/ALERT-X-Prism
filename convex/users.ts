import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      user,
      profile,
    };
  },
});

export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("government"), v.literal("public"), v.literal("private")),
    organization: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Profile already exists");
    }

    const permissions = getPermissionsByRole(args.role);

    return await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      organization: args.organization,
      permissions,
      preferences: {
        notifications: true,
        alertTypes: ["accident", "fire", "traffic_jam"],
      },
    });
  },
});

export const updateUserProfile = mutation({
  args: {
    role: v.optional(v.union(v.literal("government"), v.literal("public"), v.literal("private"))),
    organization: v.optional(v.string()),
    preferences: v.optional(v.object({
      notifications: v.boolean(),
      alertTypes: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: any = {};
    
    if (args.role) {
      updates.role = args.role;
      updates.permissions = getPermissionsByRole(args.role);
    }
    
    if (args.organization !== undefined) {
      updates.organization = args.organization;
    }
    
    if (args.preferences) {
      updates.preferences = args.preferences;
    }

    await ctx.db.patch(profile._id, updates);
  },
});

function getPermissionsByRole(role: "government" | "public" | "private"): string[] {
  switch (role) {
    case "government":
      return [
        "view_all_cameras",
        "manage_incidents",
        "view_analytics",
        "manage_users",
        "emergency_response",
      ];
    case "private":
      return [
        "view_own_cameras",
        "manage_own_cameras",
        "receive_alerts",
        "view_public_map",
      ];
    case "public":
    default:
      return [
        "view_public_map",
        "view_traffic_data",
        "get_route_suggestions",
      ];
  }
}
