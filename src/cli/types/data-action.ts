import type { WebScrapingApi } from "@decodo/sdk-ts";

export interface DataActionContext<Options> {
  api: WebScrapingApi;
  input: string;
  options: Options;
  verbose: boolean;
}

export type DataActionHandler<Options> = (
  context: DataActionContext<Options>
) => Promise<void>;
