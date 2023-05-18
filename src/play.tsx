import { connect, control } from "./roon-core";
import { showHUD } from "@raycast/api";

export default async function Command() {
  const { zones } = await connect();
  const zone = zones[2];

  await control(zone, "play");

  await showHUD(`Playing on ${zone.display_name}`);
}
