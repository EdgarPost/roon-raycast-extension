declare module "node-roon-api-browse" {
  export default class RoonApiBrowse {
    browse(opts: unknown, callback: (error: Error | false, body: unknown) => void): void;
    load(opts: unknown, callback: (error: Error | false, body: unknown) => void): void;
  }
}
