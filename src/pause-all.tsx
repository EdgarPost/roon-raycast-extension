import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { control } from "./roon/zone";

/**
 * Pause playback on all zones.
 */
export default async function Command() {
  try {
    const { zones } = await connect();

    if (zones.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No Zones Available",
        message: "No Roon zones found",
      });
      return;
    }

    // Pause all zones
    await Promise.all(zones.map((zone) => control(zone, "pause")));
    await showHUD(`⏸️ Paused all ${zones.length} zone${zones.length > 1 ? "s" : ""}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Pause All Zones",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
