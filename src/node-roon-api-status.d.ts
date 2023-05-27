declare module "node-roon-api-status" {
  import RoonApi from "node-roon-api";

  export default class RoonApiStatus {
    constructor(core: RoonApi);
    set_status: (status: string | number | Date, isError: boolean) => void;
  }
}
