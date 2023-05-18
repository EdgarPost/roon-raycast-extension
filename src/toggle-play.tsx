import { connect, control } from "./roon-core";
import { showHUD } from "@raycast/api";

export default async function Command() {
  const { zones } = await connect();

  const zone = zones[0];
  await control(zone, "playpause");

  await showHUD(`Toggled playback on ${zone.display_name}`);
}
