import { showHUD } from "@raycast/api";
import { connect } from "./roon-core";
import { control } from "./roon/zone";

export default async function Command() {
  const { zones } = await connect();
  const zone = zones[2];

  await control(zone, "play");

  await showHUD(`Playing on ${zone.display_name}`);
}
