declare module "node-roon-api-transport" {
  import { Zone } from "node-roon-api";

  export type SubscribeZoneCmd = "Subscribed" | "Changed" | "Unsubscribed";

  export type RoonZoneEventData = {
    zones_changed?: Array<Zone>;
    zones_added?: Array<Zone>;
    zones_removed?: Array<Zone["zone_id"]>;
    zones_seek_changed?: Array<Zone>;
    zones?: Array<Zone>;
  };

  type SubscribeZonesCallback<T> = (cmd: SubscribeZoneCmd, data: T) => void;

  export default class RoonApiTransport {
    change_settings(zone: Zone | Output, settings: ZoneSettings, callback?: RoonCallback): void;
    change_volume(
      output: Output,
      how: "absolute" | "relative" | "relative_step",
      value: number,
      callback?: RoonCallback
    ): void;
    control: (zone: Zone | Output, control: ControlAction, callback?: RoonCallback) => void;
    convenience_switch: (
      zone: Output,
      options: {
        control_key?: string;
      },
      callback?: RoonCallback
    ) => void;
    group_outputs: (outputs: Output[], callback?: RoonCallback) => void;
    mute: (output: Output, how: "mute" | "unmute", callback?: RoonCallback) => void;
    mute_all: (how: "mute" | "unmute", callback?: RoonCallback) => void;
    pause_all: (callback?: RoonCallback) => void;
    seek: (zone: Zone | Output, how: "relative" | "absolute", seconds: number, callback?: RoonCallback) => void;
    standby: (
      output: Output,
      options: {
        control_key?: string;
      },
      callback?: RoonCallback
    ) => void;
    toggle_standby: (output: Output, options: { control_key?: string }, callback?: RoonCallback) => void;
    transfer_zone: (from: Zone | Output, to: Zone | Output, callback?: RoonCallback) => void;
    ungroup_outputs: (outputs: [Output], callback?: RoonCallback) => void;
    subscribe_zones: <T>(callback: SubscribeZonesCallback<T>) => void;
  }
}
