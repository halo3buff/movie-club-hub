declare module "heic2any" {
  interface Heic2AnyOptions {
    blob: Blob;
    toType?: "image/png" | "image/jpeg" | "image/gif";
    quality?: number;
    multiple?: boolean;
  }

  function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>;

  export default heic2any;
}
