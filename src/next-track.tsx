import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { control } from "./roon/zone";
import { ZonePersistenceService } from "./services/zonePersistence";

/**
 * Skip to the next track on the last-used zone.
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
    const lastZoneId = await ZonePersistenceService.getLastZone("next-track");
    const zone = zones.find((z) => z.zone_id === lastZoneId) || zones[0];

    await control(zone, "next");
    await ZonePersistenceService.setLastZone("next-track", zone.zone_id);
    await showHUD(`⏭️ Next track on ${zone.display_name}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Skip Track",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
