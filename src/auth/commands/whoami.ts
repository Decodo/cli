import { Command } from "commander";
import { EXIT } from "../../platform/constants.js";
import { AUTH_MISSING_MESSAGE } from "../constants.js";
import { getRootOpts } from "../services/global-opts.js";
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
      console.error(AUTH_MISSING_MESSAGE);
      process.exit(EXIT.AUTH);
    }

    console.log(`source: ${source}`);
    console.log(`token: ${mask(token, 4, -4)}`);
  });
