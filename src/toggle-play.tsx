import { connect } from "./roon-core";
import { control } from "./roon/zone";

export default async function Command() {
  const { zones } = await connect();

  const zone = zones[0];
  return control(zone, "playpause");
}
