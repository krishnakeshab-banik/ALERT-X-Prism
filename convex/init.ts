import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const initializeDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Generate comprehensive dummy data
    await ctx.runMutation(internal.dummyData.generateDummyCameras, {});
    await ctx.runMutation(internal.dummyData.generateDummyTrafficData, {});
    await ctx.runMutation(internal.dummyData.generateDummyIncidents, {});

    return { 
      success: true, 
      message: "Demo data initialized successfully",
      cameras: 8,
      trafficData: "Generated",
      incidents: "Generated"
    };
  },
});
