import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run traffic analysis every 30 seconds
crons.interval(
  "traffic analysis",
  { seconds: 30 },
  internal.analysis.runPeriodicAnalysisInternal,
  {}
);

export default crons;
