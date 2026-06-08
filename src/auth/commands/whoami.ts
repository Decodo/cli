import { Command } from "commander";
import { getRootOpts } from "../../cli/services/global-opts.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import { AuthRequiredError } from "../errors/auth-required-error.js";
import { mask } from "../services/mask.js";
import { resolveAuthToken } from "../services/resolve-token.js";

export const whoamiCommand = new Command("whoami")
  .description("Show the active auth source and masked token")
  .action(async (_options, command) => {
    const rootOpts = getRootOpts(command);
    const { token, source } = await resolveAuthToken({
      token: rootOpts.token,
    });

    if (!token) {
      handleCliError(new AuthRequiredError());
    }

    console.log(`source: ${source}`);
    console.log(`token: ${mask(token, 4, -4)}`);
  });
