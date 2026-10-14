import type { Command } from "commander";
import { AUTH_TYPE } from "../../auth/constants.js";
import { ApiKeyRequiredError } from "../../auth/errors/api-key-required-error.js";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import { resolveAuthToken } from "../../auth/services/resolve-token.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import { createDecodoClient } from "../../scrape/services/client.js";
import type { DataActionHandler } from "../types/data-action.js";
import { getRootOpts } from "./global-opts.js";
import { verboseLog } from "./verbose-log.js";

export function createDataAction<Options>(handler: DataActionHandler<Options>) {
  return async (
    input: string,
    _localOptions: unknown,
    command: Command
  ): Promise<void> => {
    const options = command.optsWithGlobals() as Options;
    const rootOpts = getRootOpts(command);
    const verbose = rootOpts.verbose === true;

    try {
      const auth = await resolveAuthToken({ token: rootOpts.token });
      verboseLog(
        verbose,
        `auth source=${auth.source} type=${auth.credential?.type ?? "none"}`
      );
      if (!auth.credential) {
        throw new AuthRequiredError();
      }
      if (auth.credential.type !== AUTH_TYPE.API_KEY) {
        throw new ApiKeyRequiredError();
      }

      const { webScrapingApi } = createDecodoClient(auth.credential);
      await handler({ api: webScrapingApi, input, options, verbose });
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Request failed." });
    }
  };
}
