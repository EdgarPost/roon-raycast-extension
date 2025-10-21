import { showHUD, showToast, Toast } from "@raycast/api";
import { connect } from "./roon-core";
import { getCore } from "./roon/core";

/**
 * Unmute all zones.
 */
export default async function Command() {
  try {
    await connect();
    const core = getCore(true);
    if (!core) {
      throw new Error("Core not available");
    }
    const transport = core.services.RoonApiTransport2;

    transport.mute_all("unmute", (error: Error | false) => {
      if (error) throw error;
    });

    await showHUD("🔊 All zones unmuted");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Unmute Failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
