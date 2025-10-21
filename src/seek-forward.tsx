import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { getCore } from "./roon/core";
import { ZonePersistenceService } from "./services/zonePersistence";
import { SettingsService } from "./services/settings";

/**
 * Seek forward in the current track by the configured step size.
 */
export default async function Command() {
  try {
    const { zones } = await connect();
    const settings = await SettingsService.get();
    const core = getCore(true);
    if (!core) {
      throw new Error("Core not available");
    }
    const transport = core.services.RoonApiTransport2;

    if (zones.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No Zones Available",
        message: "No Roon zones found",
      });
      return;
    }

    const lastZoneId = await ZonePersistenceService.getLastZone("seek-forward");
    const zone = zones.find((z) => z.zone_id === lastZoneId) || zones[0];

    if (!zone.is_seek_allowed) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Seek Not Available",
        message: "Current track does not support seeking",
      });
      return;
    }

    transport.seek(zone, "relative", settings.seekStepSeconds, (error: Error | false) => {
      if (error) throw error;
    });

    await ZonePersistenceService.setLastZone("seek-forward", zone.zone_id);
    await showHUD(`⏩ +${settings.seekStepSeconds}s on ${zone.display_name}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Seek Failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
