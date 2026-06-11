/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as affiliates_d from "../affiliates/d.js";
import type * as affiliates_lib from "../affiliates/lib.js";
import type * as affiliates_m from "../affiliates/m.js";
import type * as affiliates_q from "../affiliates/q.js";
import type * as auth from "../auth.js";
import type * as documents_d from "../documents/d.js";
import type * as emailSettings_d from "../emailSettings/d.js";
import type * as emailSettings_m from "../emailSettings/m.js";
import type * as emailSettings_q from "../emailSettings/q.js";
import type * as files_get from "../files/get.js";
import type * as files_upload from "../files/upload.js";
import type * as insurancePolicies_d from "../insurancePolicies/d.js";
import type * as insurancePolicies_m from "../insurancePolicies/m.js";
import type * as insurancePolicies_q from "../insurancePolicies/q.js";
import type * as userProfiles_d from "../userProfiles/d.js";
import type * as userProfiles_m from "../userProfiles/m.js";
import type * as userProfiles_q from "../userProfiles/q.js";
import type * as users_create from "../users/create.js";
import type * as users_d from "../users/d.js";
import type * as users_q from "../users/q.js";
import type * as users_update from "../users/update.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "affiliates/d": typeof affiliates_d;
  "affiliates/lib": typeof affiliates_lib;
  "affiliates/m": typeof affiliates_m;
  "affiliates/q": typeof affiliates_q;
  auth: typeof auth;
  "documents/d": typeof documents_d;
  "emailSettings/d": typeof emailSettings_d;
  "emailSettings/m": typeof emailSettings_m;
  "emailSettings/q": typeof emailSettings_q;
  "files/get": typeof files_get;
  "files/upload": typeof files_upload;
  "insurancePolicies/d": typeof insurancePolicies_d;
  "insurancePolicies/m": typeof insurancePolicies_m;
  "insurancePolicies/q": typeof insurancePolicies_q;
  "userProfiles/d": typeof userProfiles_d;
  "userProfiles/m": typeof userProfiles_m;
  "userProfiles/q": typeof userProfiles_q;
  "users/create": typeof users_create;
  "users/d": typeof users_d;
  "users/q": typeof users_q;
  "users/update": typeof users_update;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
