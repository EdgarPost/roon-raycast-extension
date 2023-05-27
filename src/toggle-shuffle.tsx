import { connect } from "./roon-core";
import { toggleShuffle } from "./roon/zone";

export default async function Command() {
  const { zones } = await connect();

  return toggleShuffle(zones[0]);
}
