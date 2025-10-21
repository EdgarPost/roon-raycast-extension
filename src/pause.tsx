import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { control } from "./roon/zone";
import { ZonePersistenceService } from "./services/zonePersistence";

/**
 * Pause playback on the last-used zone.
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
    const lastZoneId = await ZonePersistenceService.getLastZone("pause");
    const zone = zones.find((z) => z.zone_id === lastZoneId) || zones[0];

    await control(zone, "pause");
    await ZonePersistenceService.setLastZone("pause", zone.zone_id);
    await showHUD(`⏸️ Paused playback on ${zone.display_name}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Pause",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
