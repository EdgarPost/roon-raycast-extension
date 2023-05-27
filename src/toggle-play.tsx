import { connect, control } from "./roon-core";

export default async function Command() {
  const { zones } = await connect();

  const zone = zones[0];
  await control(zone, "playpause");
}
