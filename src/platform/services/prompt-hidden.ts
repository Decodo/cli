import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { CliUsageError } from "./handle-cli-error.js";

const CHAR_ETX = 3;
const CHAR_EOT = 4;
const CHAR_DEL = 127;
const CHAR_BACKSPACE = 8;

interface HiddenPromptState {
  cleanup: () => void;
  input: string;
  reject: (reason: Error) => void;
  resolve: (value: string) => void;
}

function handleHiddenPromptChar(char: string, state: HiddenPromptState): void {
  const code = char.charCodeAt(0);

  if (code === CHAR_ETX) {
    state.cleanup();
    stdout.write("\n");
    state.reject(new Error("Cancelled."));
    return;
  }

  if (code === CHAR_EOT) {
    state.cleanup();
    stdout.write("\n");
    state.reject(new CliUsageError("No auth token provided on stdin."));
    return;
  }

  if (char === "\r" || char === "\n") {
    state.cleanup();
    stdout.write("\n");
    state.resolve(state.input.trim());
    return;
  }

  if (code === CHAR_DEL || code === CHAR_BACKSPACE) {
    if (state.input.length > 0) {
      state.input = state.input.slice(0, -1);
      stdout.write("\b \b");
    }
    return;
  }

  state.input += char;
}

async function promptViaReadline(message: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return await new Promise<string>((resolve, reject) => {
      rl.question(message).then((answer) => resolve(answer.trim()), reject);
      rl.once("close", () => {
        reject(new CliUsageError("No auth token provided on stdin."));
      });
    });
  } finally {
    rl.close();
  }
}

export async function promptHidden(message: string): Promise<string> {
  if (!stdin.isTTY) {
    return await promptViaReadline(message);
  }

  stdout.write(message);

  return new Promise((resolve, reject) => {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const state: HiddenPromptState = {
      input: "",
      cleanup: () => undefined,
      resolve,
      reject,
    };

    const onData = (chunk: string): void => {
      for (const char of chunk) {
        handleHiddenPromptChar(char, state);
      }
    };

    const onEnd = (): void => {
      state.cleanup();
      stdout.write("\n");
      reject(new CliUsageError("No auth token provided on stdin."));
    };

    state.cleanup = (): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdin.removeListener("end", onEnd);
    };

    stdin.on("data", onData);
    stdin.on("end", onEnd);
  });
}
