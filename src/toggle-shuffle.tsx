import { changeSettings, connect, control } from "./roon-core";
import { showHUD } from "@raycast/api";

export default async function Command() {
  const { zones } = await connect();

  const shuffle = !zones[0].settings.shuffle;

  const zone = zones[0];
  await changeSettings(zone, {
    shuffle: !zone.settings.shuffle,
  });

  await showHUD(`Shuffle turned ${shuffle ? "on" : "off"} on ${zone.display_name}`);
}
