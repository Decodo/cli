import { Command } from "commander";
import { getRootOpts } from "../../cli/services/global-opts.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import { AUTH_TYPE } from "../constants.js";
import { AuthRequiredError } from "../errors/auth-required-error.js";
import { mask } from "../services/mask.js";
import { resolveAuthToken } from "../services/resolve-token.js";
import type { AuthType } from "../types/credential.js";

const CREDENTIAL_LABEL: Record<AuthType, string> = {
  [AUTH_TYPE.API_KEY]: "api key",
  [AUTH_TYPE.TOKEN]: "token",
};

export const whoamiCommand = new Command("whoami")
  .description("Show the active auth source and masked token")
  .action(async (_options, command) => {
    const rootOpts = getRootOpts(command);
    const { credential, source } = await resolveAuthToken({
      token: rootOpts.token,
    });

    if (!credential) {
      handleCliError(new AuthRequiredError());
    }

    console.log(`source: ${source}`);
    console.log(
      `${CREDENTIAL_LABEL[credential.type]}: ${mask(credential.value, 4, -4)}`
    );
  });
