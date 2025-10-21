import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { control } from "./roon/zone";
import { ZonePersistenceService } from "./services/zonePersistence";

/**
 * Skip to the previous track on the last-used zone.
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
    const lastZoneId = await ZonePersistenceService.getLastZone("previous-track");
    const zone = zones.find((z) => z.zone_id === lastZoneId) || zones[0];

    await control(zone, "previous");
    await ZonePersistenceService.setLastZone("previous-track", zone.zone_id);
    await showHUD(`⏮️ Previous track on ${zone.display_name}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Go to Previous Track",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
