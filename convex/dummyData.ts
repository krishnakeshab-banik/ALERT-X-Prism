import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Generate realistic dummy camera data
export const generateDummyCameras = internalMutation({
  args: {},
  handler: async (ctx) => {
    const dummyCameras = [
      // High traffic areas with frequent incidents
      {
        name: "MG Road Junction - Main Intersection",
        location: { lat: 12.9716, lng: 77.5946, address: "MG Road, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["accident", "crowd", "traffic_jam"],
        trafficLevel: "high" as const,
        lastIncident: "accident",
        incidentCount: 15
      },
      {
        name: "Silk Board Signal - Heavy Traffic",
        location: { lat: 12.9165, lng: 77.6224, address: "Silk Board, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["traffic_jam", "crowd"],
        trafficLevel: "high" as const,
        lastIncident: "traffic_jam",
        incidentCount: 23
      },
      {
        name: "Electronic City Toll - Fire Prone",
        location: { lat: 12.8456, lng: 77.6603, address: "Electronic City, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["fire", "accident"],
        trafficLevel: "medium" as const,
        lastIncident: "fire",
        incidentCount: 8
      },
      {
        name: "Koramangala 5th Block - Crowd Detection",
        location: { lat: 12.9352, lng: 77.6245, address: "Koramangala, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["crowd", "unauthorized_movement"],
        trafficLevel: "medium" as const,
        lastIncident: "crowd",
        incidentCount: 12
      },
      {
        name: "Whitefield Main Road - Accident Zone",
        location: { lat: 12.9698, lng: 77.7500, address: "Whitefield, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["accident", "traffic_jam"],
        trafficLevel: "high" as const,
        lastIncident: "accident",
        incidentCount: 18
      },
      {
        name: "Indiranagar 100 Feet Road",
        location: { lat: 12.9719, lng: 77.6412, address: "Indiranagar, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["crowd", "traffic_jam"],
        trafficLevel: "medium" as const,
        lastIncident: "crowd",
        incidentCount: 9
      },
      {
        name: "Jayanagar 4th Block - Fire Station Area",
        location: { lat: 12.9249, lng: 77.5833, address: "Jayanagar, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["fire", "accident"],
        trafficLevel: "low" as const,
        lastIncident: "fire",
        incidentCount: 5
      },
      {
        name: "Marathahalli Bridge - Heavy Vehicles",
        location: { lat: 12.9589, lng: 77.7014, address: "Marathahalli, Bangalore" },
        type: "government" as const,
        status: "active" as const,
        incidentTypes: ["accident", "traffic_jam"],
        trafficLevel: "high" as const,
        lastIncident: "accident",
        incidentCount: 21
      }
    ];

    const insertedCameras = [];
    for (const camera of dummyCameras) {
      const existing = await ctx.db
        .query("cameras")
        .filter((q) => q.eq(q.field("name"), camera.name))
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("cameras", {
          name: camera.name,
          location: camera.location,
          type: camera.type,
          status: camera.status,
          ownerId: undefined,
          operationalHours: {
            start: "06:00",
            end: "22:00"
          },
          lastAnalysis: Date.now()
        });
        insertedCameras.push({ id, ...camera });
      }
    }

    return insertedCameras;
  },
});

// Generate realistic traffic data for dummy cameras
export const generateDummyTrafficData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cameras = await ctx.db.query("cameras").collect();
    const trafficData = [];

    for (const camera of cameras) {
      // Generate realistic traffic data based on camera characteristics
      const baseTraffic = Math.random() * 100;
      const vehicleCount = {
        cars: Math.floor(baseTraffic * 0.6),
        bikes: Math.floor(baseTraffic * 0.25),
        trucks: Math.floor(baseTraffic * 0.1),
        buses: Math.floor(baseTraffic * 0.05),
      };

      const totalVehicles = vehicleCount.cars + vehicleCount.bikes + vehicleCount.trucks + vehicleCount.buses;
      
      let trafficIntensity: "low" | "medium" | "high" = "low";
      let congestionLevel = 0;
      
      if (totalVehicles > 60) {
        trafficIntensity = "high";
        congestionLevel = 70 + Math.random() * 30;
      } else if (totalVehicles > 30) {
        trafficIntensity = "medium";
        congestionLevel = 40 + Math.random() * 30;
      } else {
        trafficIntensity = "low";
        congestionLevel = Math.random() * 40;
      }

      const data = await ctx.db.insert("trafficData", {
        cameraId: camera._id,
        timestamp: Date.now(),
        vehicleCount,
        peopleCount: Math.floor(Math.random() * 50) + 10,
        trafficIntensity,
        averageSpeed: Math.max(10, 60 - (congestionLevel * 0.5)),
        congestionLevel: Math.round(congestionLevel),
      });

      trafficData.push(data);
    }

    return trafficData;
  },
});

// Generate realistic incidents for dummy cameras
export const generateDummyIncidents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cameras = await ctx.db.query("cameras").collect();
    const incidents = [];

    for (const camera of cameras) {
      // 30% chance of generating an incident for each camera
      if (Math.random() < 0.3) {
        const incidentTypes = ["accident", "fire", "crowd", "traffic_jam", "unauthorized_movement"];
        const severities = ["low", "medium", "high", "critical"];
        
        const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        
        const descriptions = {
          accident: [
            "Vehicle collision detected at intersection",
            "Multi-vehicle accident with injuries",
            "Minor fender bender reported",
            "Motorcycle accident with debris on road"
          ],
          fire: [
            "Smoke detected from vehicle engine",
            "Electrical fire in nearby building",
            "Vehicle fire spreading to other cars",
            "Industrial fire with heavy smoke"
          ],
          crowd: [
            "Large gathering blocking traffic",
            "Protest march on main road",
            "Festival crowd causing congestion",
            "Emergency evacuation in progress"
          ],
          traffic_jam: [
            "Heavy congestion due to construction",
            "Traffic backup from previous accident",
            "Rush hour gridlock detected",
            "Signal malfunction causing delays"
          ],
          unauthorized_movement: [
            "Pedestrian crossing against signal",
            "Vehicle moving in wrong direction",
            "Unauthorized vehicle in restricted area",
            "Suspicious activity detected"
          ]
        };

        const description = descriptions[type as keyof typeof descriptions][
          Math.floor(Math.random() * descriptions[type as keyof typeof descriptions].length)
        ];

        const incident = await ctx.db.insert("incidents", {
          cameraId: camera._id,
          type: type as any,
          severity: severity as any,
          status: "pending",
          location: camera.location,
          description,
          confidence: 0.7 + Math.random() * 0.3,
          assignedTo: undefined,
          resolvedAt: undefined,
          notificationsSent: false,
        });

        incidents.push(incident);
      }
    }

    return incidents;
  },
});
