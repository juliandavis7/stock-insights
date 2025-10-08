/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as lib_services_analyst_estimates from "../lib/services/analyst_estimates.js";
import type * as lib_services_data_fetcher from "../lib/services/data_fetcher.js";
import type * as lib_services_fmp_service from "../lib/services/fmp_service.js";
import type * as lib_services_metrics_calculator from "../lib/services/metrics_calculator.js";
import type * as lib_services_metrics_service from "../lib/services/metrics_service.js";
import type * as lib_services_mock_data_loader from "../lib/services/mock_data_loader.js";
import type * as lib_types_financial from "../lib/types/financial.js";
import type * as lib_types_financial_extended from "../lib/types/financial_extended.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  http: typeof http;
  "lib/services/analyst_estimates": typeof lib_services_analyst_estimates;
  "lib/services/data_fetcher": typeof lib_services_data_fetcher;
  "lib/services/fmp_service": typeof lib_services_fmp_service;
  "lib/services/metrics_calculator": typeof lib_services_metrics_calculator;
  "lib/services/metrics_service": typeof lib_services_metrics_service;
  "lib/services/mock_data_loader": typeof lib_services_mock_data_loader;
  "lib/types/financial": typeof lib_types_financial;
  "lib/types/financial_extended": typeof lib_types_financial_extended;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
