/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analysis from "../analysis.js";
import type * as auth from "../auth.js";
import type * as cameras from "../cameras.js";
import type * as crons from "../crons.js";
import type * as dummyData from "../dummyData.js";
import type * as http from "../http.js";
import type * as incidents from "../incidents.js";
import type * as init from "../init.js";
import type * as router from "../router.js";
import type * as routes from "../routes.js";
import type * as traffic from "../traffic.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analysis: typeof analysis;
  auth: typeof auth;
  cameras: typeof cameras;
  crons: typeof crons;
  dummyData: typeof dummyData;
  http: typeof http;
  incidents: typeof incidents;
  init: typeof init;
  router: typeof router;
  routes: typeof routes;
  traffic: typeof traffic;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
