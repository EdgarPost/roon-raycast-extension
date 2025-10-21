import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { getCore } from "./roon/core";

/**
 * Mute all zones.
 */
export default async function Command() {
  try {
    await connect();
    const core = getCore(true);
    if (!core) {
      throw new Error("Core not available");
    }
    const transport = core.services.RoonApiTransport2;

    transport.mute_all("mute", (error: Error | false) => {
      if (error) throw error;
    });

    await showHUD("🔇 All zones muted");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Mute Failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
