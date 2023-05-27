import events from "events";

export class RoonEventBus<Commands> {
  private eventEmitter = new events.EventEmitter();

  emit<T>(event: ROON_EVENT, cmd: Commands, data: T): boolean {
    return this.eventEmitter.emit(event as unknown as string | symbol, cmd, data as unknown);
  }

  on<T>(event: ROON_EVENT, listener: (cmd: Commands, data: T) => void) {
    return this.eventEmitter.on(event as unknown as string | symbol, listener);
  }
}

export type RoonZoneCmd = "Subscribed" | "Changed" | "Unsubscribed";

export enum ROON_EVENT {
  EVENT_ZONES = "roon.transport.zones",
}

export const roonEventBus = new RoonEventBus<RoonZoneCmd>();
