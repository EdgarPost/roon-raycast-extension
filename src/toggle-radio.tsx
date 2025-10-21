import { showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { toggleRadio } from "./roon/zone";
import { ZonePersistenceService } from "./services/zonePersistence";

/**
 * Toggle auto-radio setting on the last-used zone.
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
    const lastZoneId = await ZonePersistenceService.getLastZone("toggle-radio");
    const zone = zones.find((z) => z.zone_id === lastZoneId) || zones[0];

    await toggleRadio(zone);
    await ZonePersistenceService.setLastZone("toggle-radio", zone.zone_id);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Toggle Radio",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
