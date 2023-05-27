declare module "node-roon-api-image" {
  export type ImageType = "image/jpeg" | "image/png";

  type GetImageOptions = {
    scale?: "fit" | "fill" | "stretch";
    width?: number;
    height?: number;
    format?: ImageType;
  };

  export type GetImageCallback = (error: boolean, contentType: GetImageOptions["format"], image: Buffer) => void;

  export default class RoonApiImage {
    get_image: (image_key: string, options: GetImageOptions, callback: GetImageCallback) => void;
  }
}
