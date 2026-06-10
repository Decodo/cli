import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

interface HiddenPromptState {
  cleanup: () => void;
  input: string;
  reject: (reason: Error) => void;
  resolve: (value: string) => void;
}

function handleHiddenPromptChar(char: string, state: HiddenPromptState): void {
  if (char === "\u0003") {
    state.cleanup();
    stdout.write("\n");
    state.reject(new Error("Cancelled."));
    return;
  }

  if (char === "\r" || char === "\n") {
    state.cleanup();
    stdout.write("\n");
    state.resolve(state.input.trim());
    return;
  }

  if (char === "\u007f" || char === "\b") {
    if (state.input.length > 0) {
      state.input = state.input.slice(0, -1);
      stdout.write("\b \b");
    }
    return;
  }

  state.input += char;
}

export async function promptHidden(message: string): Promise<string> {
  if (!stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      return (await rl.question(message)).trim();
    } finally {
      rl.close();
    }
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

    state.cleanup = (): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    stdin.on("data", onData);
  });
}
