import { Command } from 'commander';
import { AUTH_MISSING_MESSAGE } from '../constants.js';
import { EXIT } from '../../platform/constants.js';
import { getRootOpts } from '../services/global-opts.js';
import { maskToken } from '../services/mask-token.js';
import { resolveAuthToken } from '../services/resolve-token.js';

export const whoamiCommand = new Command('whoami')
  .description('Show the active auth source and masked token')
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
    console.log(`token: ${maskToken(token)}`);
  });
