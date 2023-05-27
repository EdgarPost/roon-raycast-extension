import RoonApi, { RoonCore, Zone } from "node-roon-api";
import RoonApiTransport, { RoonZoneEventData } from "node-roon-api-transport";
import RoonApiStatus from "node-roon-api-status";
import RoonApiImage from "node-roon-api-image";
import RoonApiBrowse from "node-roon-api-browse";

import fs from "fs";
import path from "path";
import { getCore, setCore } from "./roon/core";
import { ROON_EVENT, roonEventBus, RoonEventBus, RoonZoneCmd } from "./roon/roonEventBus";

export const image = async (key: string): Promise<string | undefined> => {
  const core = getCore(true);

  return new Promise((resolve) =>
    core?.services.RoonApiImage2.get_image(
      key,
      {
        scale: "fit",
        width: 200,
        height: 200,
      },
      (error, contentType, image) => resolve(`data:${contentType};base64,${image.toString("base64")}`)
    )
  );
};

type ConnectResult = Promise<{
  core: RoonCore;
  eventBus: RoonEventBus<RoonZoneCmd>;
  zones: Zone[];
}>;

export function connect(): ConnectResult {
  const core = getCore();

  if (core) {
    return Promise.resolve({ core, eventBus: roonEventBus, zones: [] });
  }

  return new Promise((resolve) => {
    const absolutePath = path.resolve(__dirname, "roonstate.json");

    const roon = new RoonApi({
      extension_id: "com.edgarpost.roon-raycast",
      display_name: "Raycast",
      display_version: "1.0.0",
      publisher: "Edgar Post",
      email: "roon-raycast@edgarpost.com",
      website: "https://github.com/edgarpost",
      set_persisted_state: (state) => fs.writeFileSync(absolutePath, JSON.stringify(state)),
      get_persisted_state: () => {
        try {
          return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
        } catch (e) {
          return {};
        }
      },
      core_paired: function (core) {
        setCore(core);

        core.services.RoonApiTransport2.subscribe_zones<RoonZoneEventData>((cmd, data) => {
          roonEventBus.emit<RoonZoneEventData>(ROON_EVENT.EVENT_ZONES, cmd, data);
        });

        resolve({ core, eventBus: roonEventBus, zones: [] });
      },

      core_unpaired: function (core) {
        // console.log(core.core_id, core.display_name, core.display_version, "-", "LOST");
      },
    });

    // setInterval(() => {/*
    //   svc_status.set_status(new Date(), false);
    // }, 1000);*/

    const svc_status = new RoonApiStatus(roon);

    roon.init_services({
      required_services: [RoonApiTransport, RoonApiImage, RoonApiBrowse],
      provided_services: [svc_status],
    });

    roon.start_discovery();
  });
}
