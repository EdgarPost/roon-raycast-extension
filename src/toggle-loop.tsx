import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { changeSettings } from "./roon/zone";
import { ZonePersistenceService } from "./services/zonePersistence";

/**
 * Cycle through loop modes (disabled -> loop -> loop_one -> disabled) on the last-used zone.
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

    // Get last-used zone for this command
    const lastZoneId = await ZonePersistenceService.getLastZone("toggle-loop");
    const zone = zones.find((z) => z.zone_id === lastZoneId) || zones[0];

    // Cycle through loop modes
    const currentLoop = zone.settings.loop;
    const nextLoop =
      currentLoop === "disabled" ? "loop" : currentLoop === "loop" ? "loop_one" : "disabled";

    await changeSettings(zone, { loop: nextLoop });
    await ZonePersistenceService.setLastZone("toggle-loop", zone.zone_id);

    const loopEmoji = nextLoop === "loop" ? "🔁" : nextLoop === "loop_one" ? "🔂" : "➡️";
    const loopText = nextLoop === "loop" ? "Loop All" : nextLoop === "loop_one" ? "Loop One" : "Loop Off";

    await showHUD(`${loopEmoji} ${loopText} on ${zone.display_name}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Toggle Loop",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
