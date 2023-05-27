import { ControlAction, Output, Zone } from "node-roon-api";
import { showHUD } from "@raycast/api";
import { getCore } from "./core";

/**
 * Control the zone, for example: play, pause, skip, etc.
 *
 * @param zone
 * @param action
 */
export const control = async (zone: Zone, action: ControlAction) => {
  const core = getCore(true);

  return new Promise((resolve) => core?.services.RoonApiTransport2.control(zone, action, resolve));
};

/**
 * Change the settings of a zone, for example: shuffle, repeat, etc.
 * @param zone
 * @param newSettings
 */
export const changeSettings = async (zone: Zone, newSettings: Partial<Zone["settings"]>) => {
  const core = getCore(true);

  return new Promise((resolve) =>
    core?.services.RoonApiTransport2.change_settings(
      zone,
      {
        ...zone.settings,
        ...newSettings,
      },
      resolve
    )
  );
};

/**
 * Toggle the shuffle setting of a zone.
 *
 * @param zone
 */
export const toggleShuffle = async (zone: Zone) => {
  const shuffle = !zone.settings.shuffle;
  await changeSettings(zone, { shuffle });

  await showHUD(`Shuffle ${shuffle ? "turned on" : "turned off"} for zone "${zone.display_name}"`);
};

/**
 * Toggle the auto-radio setting of a zone.
 *
 * @param zone
 */
export const toggleRadio = async (zone: Zone) => {
  const auto_radio = !zone.settings.auto_radio;
  await changeSettings(zone, { auto_radio });

  await showHUD(`Auto radio ${auto_radio ? "turned on" : "turned off"} for zone "${zone.display_name}"`);
};

/**
 * Sets the mute state of a zone.
 *
 * @param zone
 * @param how
 */
const setMute = async (zone: Zone, how: "mute" | "unmute") => {
  const core = getCore(true);

  return new Promise((resolve) => {
    for (const output of zone.outputs) {
      core?.services.RoonApiTransport2.mute(output, how, resolve);
    }
  });
};

/**
 * Mutes all outputs of a zone.
 *
 * @param zone
 */
export const mute = async (zone: Zone) => setMute(zone, "mute");

/**
 * Unmutes all outputs of a zone.
 *
 * @param zone
 */
export const unmute = async (zone: Zone) => setMute(zone, "unmute");

/**
 * Sets the volume of a zone.
 *
 * @param zone
 * @param how
 * @param value
 */
export const setVolume = async (zone: Zone, how: "absolute" | "relative" | "relative_step", value: number) => {
  const core = getCore(true);

  return new Promise((resolve) => {
    for (const output of zone.outputs) {
      if (output.volume?.type === "number") {
        core?.services.RoonApiTransport2.change_volume(output, how, value, resolve);
      }
    }
  });
};

/**
 * Increases the volume of all outputs of a zone.
 * @param zone
 * @param value
 */
export const increaseVolume = (zone: Zone, value = 1) => setVolume(zone, "relative_step", value);

/**
 * Decreases the volume of all outputs of a zone.
 * @param zone
 * @param value
 */
export const decreaseVolume = (zone: Zone, value = 1) => setVolume(zone, "relative_step", -value);
