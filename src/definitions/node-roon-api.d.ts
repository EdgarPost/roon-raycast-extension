declare module "node-roon-api" {
  import RoonApiTransport from "node-roon-api-transport";
  import RoonApiImage from "node-roon-api-image";

  export type Zone = {
    zone_id: string;
    display_name: string;
    outputs: Output[];
    state: "playing" | "paused" | "loading" | "stopped";
    seek_position?: number;
    is_previous_allowed: boolean;
    is_next_allowed: boolean;
    is_pause_allowed: boolean;
    is_play_allowed: boolean;
    is_seek_allowed: boolean;
    queue_items_remaining?: number;
    queue_time_remaining?: number;
    settings: ZoneSettings;
    now_playing: NowPlaying;
  };

  export type Output = {
    output_id: string;
    zone_id: string;
    display_name: string;
    state: "playing" | "paused" | "loading" | "stopped";
    source_controls?: SourceControl[];
    volume?: OutputVolume;
  };

  export type OutputVolume = {
    type?: "number" | "db" | "incremental" | "*";
    min?: number;
    max?: number;
    value?: number;
    step?: number;
    is_muted?: boolean;
  };

  export type SourceControl = {
    display_name: string;
    status: "selected" | "deselected" | "standby" | "indeterminate";
    supports_standby: boolean;
  };

  export type ControlAction = "play" | "pause" | "playpause" | "stop" | "previous" | "next";

  type NowPlaying = {
    seek_position: Zone["seek_position"];
    length: number;
    image_key: string;
    image_src?: string;
    one_line: {
      line1: string;
    };
    two_line: {
      line1: string;
      line2: string;
    };
    three_line: {
      line1: string;
      line2: string;
      line3: string;
    };
  };

  type ZoneSettings = {
    loop: "loop" | "loop_one" | "disabled";
    shuffle: boolean;
    auto_radio: boolean;
  };

  export type RoonCallback = (error: Error | false, body: unknown) => void;

  export default class RoonApi {
    constructor(options: CoreOptions);
    public init_services(services: { required_services?: Array; provided_services?: Array }): void;
    public start_discovery(): void;
    public stop_discovery(): void;
    public register_service(service: RoonApiTransport): void;
    public unregister_service(service: RoonApiTransport): void;
    public get_services(): RoonApiTransport[];
    public get_extension_id(): string;
    public get_core(core_id: string): RoonApiTransport | undefined;
    public extension_terminate(): void;
    public core_paired(core: RoonCore): void;
  }

  type ConfigStore = {
    tokens: Record<string, string>;
    paired_core_id: string;
  };

  type CoreOptions = {
    extension_id: string;
    display_name: string;
    display_version: string;
    publisher: string;
    email: string;
    website: string;
    log_level?: "all" | "none";
    core_paired?: (core: RoonCore) => void;
    core_unpaired?: (core: RoonCore) => void;
    set_persisted_state?: (state: ConfigStore) => void;
    get_persisted_state?: () => ConfigStore;
  };

  export type RoonCore = {
    services: {
      RoonApiTransport2: RoonApiTransport;
      RoonApiImage2: RoonApiImage;
    };
  };

  // export declare class RoonApiTransport {
  //   constructor(opts: RoonApiTransportOptions);
  //
  //   public services: {
  //     RoonApiTransport: {
  //       send_continue: (command: string, body: object, cb: (msg: object) => void) => void;
  //       subscribe_zones: (callback: (cmd: string, data: object) => void) => void;
  //     };
  //     RoonApiTransport2: {
  //       change_zone: (zone_id: string) => void;
  //       get_settings: (zone_id: string, cb: (msg: object) => void) => void;
  //       subscribe_zones: (callback: (cmd: string, data: object) => void) => void;
  //       subscribe_zones_changed: (callback: (cmd: string, data: object) => void) => void;
  //       subscribe_outputs: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //       subscribe_outputs_changed: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //       subscribe_source_controls: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //       subscribe_volume_controls: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //       unsubscribe_zones: () => void;
  //       unsubscribe_zones_changed: () => void;
  //       unsubscribe_outputs: (zone_id: string) => void;
  //       unsubscribe_outputs_changed: (zone_id: string) => void;
  //       unsubscribe_source_controls: (zone_id: string) => void;
  //       unsubscribe_volume_controls: (zone_id: string) => void;
  //       set_volume: (output_id: string, volume: number, cb: (msg: object) => void) => void;
  //       set_mute: (output_id: string, mute: boolean, cb: (msg: object) => void) => void;
  //       set_image: (output_id: string, image_key: string, image_url: string, cb: (msg: object) => void) => void;
  //       set_name: (output_id: string, name: string, cb: (msg: object) => void) => void;
  //       set_zone_params: (zone_id: string, params: object, cb: (msg: object) => void) => void;
  //       set_output_params: (output_id: string, params: object, cb: (msg: object) => void) => void;
  //       set_source_controls: (zone_id: string, controls: object[], cb: (msg: object) => void) => void;
  //       set_volume_controls: (zone_id: string, controls: object[], cb: (msg: object) => void) => void;
  //     };
  //   };
  //
  //   public add_service(name: string, opts: object): void;
  //
  //   public set_subscribed_zones(zones: string[]): void;
  //
  //   public set_subscribed_outputs(zone_id: string, outputs: string[]): void;
  //
  //   public set_subscribed_source_controls(zone_id: string, controls: string[]): void;
  //
  //   public set_subscribed_volume_controls(zone_id: string, controls: string[]): void;
  //
  //   public set_zone_params(zone_id: string, params: object, cb: (msg: object) => void): void;
  //
  //   public set_output_params(output_id: string, params: object, cb: (msg: object) => void): void;
  // }
  //
  // export interface RoonApiTransportOptions {
  //   provides?: string[];
  //   required_services?: string[];
  //   optional_services?: string[];
  //   setup?: (zones: string[], outputs: string[], source_controls: string[], volume_controls: string[]) => void;
  //   get_zones?: (cb: (msg: object) => void) => void;
  //   get_outputs?: (cb: (msg: object) => void) => void;
  //   get_source_controls?: (zone_id: string, cb: (msg: object) => void) => void;
  //   get_volume_controls?: (zone_id: string, cb: (msg: object) => void) => void;
  //   set_volume?: (output_id: string, volume: number, cb: (msg: object) => void) => void;
  //   set_mute?: (output_id: string, mute: boolean, cb: (msg: object) => void) => void;
  //   set_image?: (output_id: string, image_key: string, image_url: string, cb: (msg: object) => void) => void;
  //   set_name?: (output_id: string, name: string, cb: (msg: object) => void) => void;
  //   subscribe_zones?: (callback: (cmd: string, data: object) => void) => void;
  //   unsubscribe_zones?: () => void;
  //   subscribe_outputs?: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //   unsubscribe_outputs?: (zone_id: string) => void;
  //   subscribe_source_controls?: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //   unsubscribe_source_controls?: (zone_id: string) => void;
  //   subscribe_volume_controls?: (zone_id: string, callback: (cmd: string, data: object) => void) => void;
  //   unsubscribe_volume_controls?: (zone_id: string) => void;
  // }
}
