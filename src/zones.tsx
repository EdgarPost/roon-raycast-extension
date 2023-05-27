import { RoonZoneEventData } from "node-roon-api-transport";
import { useEffect, useState } from "react";
import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { connect, image } from "./roon-core";
import { Zone } from "node-roon-api";
import { control, decreaseVolume, increaseVolume, mute, toggleRadio, toggleShuffle, unmute } from "./roon/zone";
import { ROON_EVENT } from "./roon/roonEventBus";

function uniqueZones(arr: Array<Zone>) {
  const unique: Record<Zone["zone_id"], boolean> = {};

  return arr.filter((zone) => {
    if (!unique[zone.zone_id]) {
      unique[zone.zone_id] = true;
      return true;
    }
    return false;
  });
}

function secondsToHms(seconds: number | undefined): string | "N/A" {
  if (!seconds) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const remainingSeconds = seconds - hours * 3600 - minutes * 60;

  const timeParts = [];
  if (hours > 0) {
    timeParts.push(hours.toString().padStart(2, "0"));
  }
  timeParts.push(minutes.toString().padStart(2, "0"));
  timeParts.push(remainingSeconds.toString().padStart(2, "0"));

  return timeParts.join(":");
}

type NowPlayingSimple = { track: string; artist: string; album: string } | null;

function zoneToNowPlaying(zone: Zone): NowPlayingSimple {
  if (!zone.now_playing) {
    return null;
  }

  const {
    three_line: { line1: track, line2: artist, line3: album },
  } = zone.now_playing;

  return { track, artist, album };
}

async function zoneWithNowPlayingImageSrc(zone: Zone): Promise<Zone> {
  if (!zone.now_playing) {
    return zone;
  }

  const imageSrc = await image(zone.now_playing.image_key);

  return {
    ...zone,
    now_playing: {
      ...zone.now_playing,
      image_src: imageSrc,
    },
  };
}

const zonesWithNowPlayingImageSrc = async (zones: Array<Zone>) => {
  const promises = zones.map(await zoneWithNowPlayingImageSrc);

  return await Promise.all(promises);
};

const nowPlayingToString = (nowPlaying: NowPlayingSimple): string => {
  if (!nowPlaying) {
    return "";
  }

  const { track, artist, album } = nowPlaying;

  return `${track} by ${artist} from ${album}`;
};

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");
  const [zonesList, setZonesList] = useState<Array<Zone>>([]);
  const [filteredZones, setFilteredZones] = useState<Array<Zone>>([]);

  useEffect(() => {
    setFilteredZones(
      zonesList
        .filter((zone) => zone.display_name.toLowerCase().includes(searchText.toLowerCase()))
        .sort((a, b) => a.display_name.localeCompare(b.display_name))
    );
  }, [searchText, zonesList]);

  useEffect(() => {
    async function fetchZones() {
      const { eventBus } = await connect();

      eventBus.on<RoonZoneEventData>(ROON_EVENT.EVENT_ZONES, async (cmd, data) => {
        switch (cmd) {
          case "Subscribed":
            if (data.zones) {
              setZonesList(await zonesWithNowPlayingImageSrc(data.zones));
            }
            break;
          case "Unsubscribed":
            setZonesList([]);
            break;
          case "Changed":
            if (data.zones_changed) {
              const newZones = await zonesWithNowPlayingImageSrc(data.zones_changed);
              setZonesList((zones) => uniqueZones([...newZones, ...zones]));
            }

            if (data.zones_added) {
              const newZones = await zonesWithNowPlayingImageSrc(data.zones_added);
              setZonesList((zones) => uniqueZones([...newZones, ...zones]));
            }

            if (data.zones_removed) {
              setZonesList((zones) => zones.filter((zone) => !data.zones_removed?.includes(zone.zone_id)));
            }

            if (data.zones_seek_changed) {
              setZonesList((zones) => {
                return zones.map((zone) => {
                  const updatedZone = data.zones_seek_changed?.find((z) => z.zone_id === zone.zone_id);

                  if (updatedZone) {
                    return {
                      ...zone,
                      queue_time_remaining: updatedZone.queue_time_remaining,
                      now_playing: {
                        ...zone.now_playing,
                        seek_position: updatedZone.seek_position,
                      },
                    };
                  }

                  return zone;
                });
              });
            }
            break;
          default:
            break;
        }
      });
    }

    if (zonesList.length === 0) {
      fetchZones();
    }
  }, []);

  function stateToIcon(state: Zone["state"]) {
    if (state === "playing") {
      return Icon.Pause;
    }

    if (state === "paused") {
      return Icon.Play;
    }

    return Icon.Circle;
  }

  return (
    <List isShowingDetail filtering={false} onSearchTextChange={setSearchText} navigationTitle="Search zones">
      {filteredZones.map((zone) => {
        const nowPlaying = zoneToNowPlaying(zone);

        return (
          <List.Item
            key={zone.zone_id}
            title={zone.display_name}
            icon={stateToIcon(zone.state)}
            accessories={[
              {
                tag: { value: zone.state, color: zone.state === "playing" ? Color.Green : Color.SecondaryText },
                tooltip: "Tag with tooltip",
              },
            ]}
            detail={
              <List.Item.Detail
                markdown={zone.now_playing ? `![Hello World](${zone.now_playing.image_src})` : undefined}
                metadata={
                  <List.Item.Detail.Metadata>
                    {nowPlaying && (
                      <>
                        <List.Item.Detail.Metadata.Label
                          title="Playtime"
                          text={`${secondsToHms(zone.now_playing.seek_position)} / ${secondsToHms(
                            zone.now_playing.length
                          )}`}
                        />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label title="Track" text={`${nowPlaying?.track}`} />
                        <List.Item.Detail.Metadata.Label title="Artist" text={`${nowPlaying?.artist}`} />
                        <List.Item.Detail.Metadata.Label title="Album" text={`${nowPlaying?.album}`} />
                        <List.Item.Detail.Metadata.Separator />
                      </>
                    )}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                {zone.is_play_allowed && (
                  <Action title="Play" icon={Icon.Play} onAction={() => control(zone, "play")} />
                )}
                {zone.is_pause_allowed && (
                  <Action title="Pause" icon={Icon.Pause} onAction={() => control(zone, "pause")} />
                )}
                {zone.is_previous_allowed && (
                  <Action
                    title="Previous Song"
                    icon={Icon.ArrowLeft}
                    onAction={() => control(zone, "previous")}
                    shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                  />
                )}
                {zone.is_next_allowed && (
                  <Action
                    title="Next Song"
                    icon={Icon.ArrowRight}
                    onAction={() => control(zone, "next")}
                    shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
                  />
                )}
                <Action title="Stop" icon={Icon.Stop} onAction={() => control(zone, "stop")} />
                <Action title="Toggle Play / Pause" icon={Icon.Circle} onAction={() => control(zone, "playpause")} />
                <Action title="Increase Volume" icon={Icon.Circle} onAction={() => increaseVolume(zone)} />
                <Action title="Decrease Volume" icon={Icon.Circle} onAction={() => decreaseVolume(zone)} />
                <Action title="Mute" icon={Icon.Circle} onAction={() => mute(zone)} />
                <Action title="Unmute" icon={Icon.Circle} onAction={() => unmute(zone)} />
                <Action
                  icon={
                    zone.settings.shuffle
                      ? { source: Icon.CheckCircle, tintColor: Color.Green }
                      : { source: Icon.Circle, tintColor: Color.Red }
                  }
                  title={zone.settings.shuffle ? "Turn Shuffle Off" : "Turn Shuffle On"}
                  onAction={() => toggleShuffle(zone)}
                />
                <Action
                  icon={
                    zone.settings.auto_radio
                      ? { source: Icon.CheckCircle, tintColor: Color.Green }
                      : { source: Icon.Circle, tintColor: Color.Red }
                  }
                  title={zone.settings.auto_radio ? "Turn Auto Radio Off" : "Turn Auto Radio On"}
                  onAction={() => toggleRadio(zone)}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
