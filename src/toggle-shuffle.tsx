import { connect, toggleShuffle } from "./roon-core";

export default async function Command() {
  const { zones } = await connect();

  return toggleShuffle(zones[0]);
}
