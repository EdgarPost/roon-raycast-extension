import { vi } from "vitest";

export const LocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  allItems: vi.fn(),
  clear: vi.fn(),
};

export const showToast = vi.fn();
export const showHUD = vi.fn();

export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
    Animated: "animated",
  },
};

export const Icon = {
  Play: "play",
  Pause: "pause",
  Forward: "forward",
  Rewind: "rewind",
  Stop: "stop",
  ArrowRight: "arrow-right",
  ArrowLeft: "arrow-left",
  Plus: "plus",
  Minus: "minus",
  Music: "music",
  Link: "link",
  Unlink: "unlink",
  Power: "power",
};
