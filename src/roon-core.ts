import RoonApi from "node-roon-api";
import RoonApiStatus from "node-roon-api-status";
import RoonApiTransport from "node-roon-api-transport";
import RoonApiImage from "node-roon-api-image";
import * as fs from "fs";
import * as path from "path";
import { showHUD } from "@raycast/api";
const EventEmitter = require("events");

let eventBus;
let coreInstance;

const checkCore = () => {
  if (!coreInstance) {
    throw new Error("Connect to core first!");
  }
};

export const control = async (zone, action) => {
  checkCore();

  return new Promise((resolve) => coreInstance.services.RoonApiTransport2.control(zone, action, resolve));
};

export const changeSettings = async (zone, newSettings) => {
  checkCore();

  return new Promise((resolve) =>
    coreInstance.services.RoonApiTransport2.change_settings(
      zone,
      {
        ...zone.settings,
        ...newSettings,
      },
      resolve
    )
  );
};

export const toggleShuffle = async (zone) => {
  const shuffle = !zone.settings.shuffle;
  await changeSettings(zone, { shuffle });

  await showHUD(`Shuffle ${shuffle ? "turned on" : "turned off"} for zone "${zone.display_name}"`);
};

export const toggleRadio = async (zone) => {
  const auto_radio = !zone.settings.auto_radio;
  await changeSettings(zone, { auto_radio });

  await showHUD(`Auto radio ${auto_radio ? "turned on" : "turned off"} for zone "${zone.display_name}"`);
};

export const EVENT_ZONES = "roon.transport.zones";

export const image = async (key) => {
  checkCore();

  return new Promise((resolve) =>
    coreInstance.services.RoonApiImage2.get_image(
      key,
      {
        scale: "fit",
        width: 200,
        height: 200,
      },
      (error, contentType, image) => resolve(`data:image/png;base64,${image.toString("base64")}`)
    )
  );
};

export function connect() {
  if (eventBus) {
    return Promise.resolve(eventBus);
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
        } catch (e) {}

        return {};
      },
      core_paired: function (core) {
        const transport = core.services.RoonApiTransport2;

        eventBus = new EventEmitter();

        coreInstance = core;
        transport.subscribe_zones(function (cmd, data) {
          eventBus.emit(EVENT_ZONES, cmd, data);
        });

        resolve({ core, eventBus });
      },

      core_unpaired: function (core) {
        eventBus = undefined;
        console.log(core.core_id, core.display_name, core.display_version, "-", "LOST");
      },
    });

    // setInterval(() => {
    //   svc_status.set_status(new Date(), false);
    // }, 1000);

    const svc_status = new RoonApiStatus(roon);

    roon.init_services({
      required_services: [RoonApiTransport, RoonApiImage],
      provided_services: [svc_status],
    });

    roon.start_discovery();
  });
}
