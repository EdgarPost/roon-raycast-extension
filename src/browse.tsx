import { useEffect, useMemo, useState } from "react";
import { Action, ActionPanel, List } from "@raycast/api";
import { connect } from "./roon-core";
import { getCore } from "./roon/core";

interface BrowseItem {
  item_key: string;
  title: string;
  subtitle?: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [itemKey, setItemKey] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState(0);

  const gotoItem = (itemKey: string) => {
    setItemKey(itemKey);
    setLevel((level) => level + 1);
  };

  const req = useMemo(() => {
    return {
      itemKey,
      level,
    };
  }, [itemKey, level]);

  useEffect(() => {
    // filterList(artists.filter((artists) => artists.includes(searchText)));
  }, [searchText]);

  const hierarchy = "browse";
  useEffect(() => {
    async function browse() {
      const { core } = await connect();
      

      core.services.RoonApiBrowse2.browse(
        {
          itemKey,
          hierarchy,
          // pop_all: true,
        },
        (_error: Error | false, _body: unknown) => {
          setLevel((level) => level + 1);
        },
      );

      
    }

    browse();
  }, [itemKey]);

  useEffect(() => {
    const core = getCore();
    
    core?.services.RoonApiBrowse2.load(
      {
        itemKey,
        hierarchy,
      },
      (error: Error | false, body: unknown) => {
        const data = body as { items: BrowseItem[] };
        setItems(data.items || []);
      },
    );
  }, [req]);

  return (
    <List
      filtering={false}
      onSearchTextChange={setSearchText}
      navigationTitle="Browse Library"
      searchBarPlaceholder="Search library..."
    >
      {items.map((item) => (
        <List.Item
          key={item.item_key}
          title={item.title}
          actions={
            <ActionPanel>
              <Action title="Select" onAction={() => gotoItem(item.item_key)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
