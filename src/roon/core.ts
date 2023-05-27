import { RoonCore } from "node-roon-api";

// This is a singleton, so we can use it to store the core instance.
export let coreInstance: undefined | RoonCore;

/**
 * Set the core instance.
 *
 * @param core
 */
export const setCore = (core: RoonCore) => {
  coreInstance = core;
};

/**
 * Check if the core instance is set. If not, throw an error.
 */
export const getCore = (throwError = false) => {
  if (!coreInstance && throwError) {
    throw new Error("Connect to core first!");
  }

  return coreInstance;
};
