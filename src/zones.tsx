import { useEffect, useState } from "react";
import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { connect, control, EVENT_ZONES, image, toggleRadio, toggleShuffle } from "./roon-core";

function uniqueZones(arr) {
  const unique = {};
  return arr.filter((item) => {
    if (!unique[item.zone_id]) {
      unique[item.zone_id] = true;
      return true;
    }
    return false;
  });
}

function secondsToHms(seconds) {
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

function zoneToNowPlaying(zone) {
  if (!zone.now_playing) {
    return null;
  }

  const {
    three_line: { line1: track, line2: artist, line3: album },
  } = zone.now_playing;

  return { track, artist, album };
}

async function zoneWithNowPlayingImageSrc(zone) {
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

const zonesWithNowPlayingImageSrc = async (zones) => {
  const promises = zones.map(await zoneWithNowPlayingImageSrc);

  return await Promise.all(promises);
};

const nowPlayingToString = (nowPlaying) => {
  if (!nowPlaying) {
    return "";
  }

  const { track, artist, album } = nowPlaying;

  return `${track} by ${artist} from ${album}`;
};

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [zonesList, setZonesList] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);

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

      eventBus.on(EVENT_ZONES, async (cmd, data) => {
        switch (cmd) {
          case "Subscribed":
            setZonesList(await zonesWithNowPlayingImageSrc(data.zones));
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
              setZonesList((zones) => zones.filter((zone) => !data.zones_removed.includes(zone.zone_id)));
            }

            if (data.zones_seek_changed) {
              setZonesList((zones) =>
                zones.map((zone) => {
                  const updatedZone = data.zones_seek_changed.find((z) => z.zone_id === zone.zone_id);

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
                })
              );
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

  // now_playing
  // seek_position: 251,
  //     length: 285,
  //     one_line: { line1: 'Alfahonan (Shooting Blanks) - Gaupa' },
  // two_line: { line1: 'Alfahonan (Shooting Blanks)', line2: 'Gaupa' },
  // three_line: {
  //     line1: 'Alfahonan (Shooting Blanks)',
  //         line2: 'Gaupa',
  //         line3: 'Feberdröm'
  // },
  // image_key: '06f2351b1909d3253e30b68a30cc799f',
  //     artist_image_keys: [ 'cf07f0b46595e3cabfe702a206b3c165' ]

  // {
  //     zone_id: '160140f1d04030e2869916450a44cd64a080',
  //         display_name: 'Woonkamer',
  //     outputs: [Array],
  //     state: 'paused',
  //     is_next_allowed: true,
  //     is_previous_allowed: true,
  //     is_pause_allowed: false,
  //     is_play_allowed: true,
  //     is_seek_allowed: true,
  //     queue_items_remaining: 3,
  //     z: 675,
  //     settings: [Object],
  //     now_playing: [Object]
  // },

  // { loop: 'disabled', shuffle: false, auto_radio: true }

  // {
  //     output_id: '170140f1d04030e2869916450a44cd64a080',
  //         zone_id: '160140f1d04030e2869916450a44cd64a080',
  //     can_group_with_output_ids: [
  //     '1701893d4b15ad7e4722b16c322658ca6a7f',
  //     '170140f1d04030e2869916450a44cd64a080',
  //     '170104da966338c3077003dc4df2d523f052'
  // ],
  //     display_name: 'Woonkamer',
  //     volume: {
  //     type: 'number',
  //         min: 0,
  //         max: 100,
  //         value: 12,
  //         step: 1,
  //         is_muted: false,
  //         hard_limit_min: 0,
  //         hard_limit_max: 100,
  //         soft_limit: 100
  // },
  //     source_controls: [ [Object] ]
  // }

  // Define markdown here to prevent unwanted indentation.

  function stateToIcon(state) {
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
      {filteredZones.map((zone, zoneIndex) => {
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
                  <Action title="Previous Song" icon={Icon.ArrowLeft} onAction={() => control(zone, "previous")} />
                )}
                {zone.is_next_allowed && (
                  <Action title="Next Song" icon={Icon.ArrowRight} onAction={() => control(zone, "next")} />
                )}
                <Action title="Stop" icon={Icon.Stop} onAction={() => control(zone, "stop")} />
                <Action title="Toggle Play / Pause" icon={Icon.Circle} onAction={() => control(zone, "playpause")} />
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
