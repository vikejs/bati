import stream from "node:stream";
import { execa as execaOrig, type ExecaError, type Options } from "execa";
import treeKill from "tree-kill";
import type { ExecaChildProcess } from "./types.js";

// Pipe any process output to this stream in order to log it with timestamps.
// See:
// * https://stackoverflow.com/questions/21491567/how-to-implement-a-writable-stream
// * https://blog.logrocket.com/running-commands-with-execa-in-node-js/
class LogStream extends stream.Writable {
  // Pass a reference to the string you want to be fed with the log.
  constructor(logReference: { log: string }) {
    super();
    this.logReference = logReference;
  }

  _write(chunk: string | Buffer, encoding: string, callback: (error?: Error | null) => void) {
    const now = new Date().toISOString();
    const text = chunk.toString().trimEnd();
    const lines = text.split("\n");
    for (const line of lines) {
      this.logReference.log += `[${now}] ${line}\n`;
    }
    callback();
  }

  private logReference: { log: string };
}

// Wrapper around https://github.com/sindresorhus/execa , extended with the following features:
// - Log stdout and stderr with timestamps.
// - Print the log on failure or timeout.
// - Add a member `log` to the returned process, for accessing the entire log at any time, even if the command hasn't
//   finished yet.
// - Add a `treekill()` method to the returned process, with a more reliable implementation as the original `kill()`.
export function execa(file: string, args?: string[], options: Options = {}): ExecaChildProcess<string> {
  const newOptions = {
    ...options,
    all: true, // create a single stream for stdout and stderr
  };

  const childProcess = execaOrig(file, args, newOptions) as ExecaChildProcess<string>;
  childProcess.log = "";
  childProcess.all?.pipe(new LogStream(childProcess));
  childProcess.treekill = treekill;
  childProcess.treekilled = false;
  childProcess.catch(printLogOnFailure);
  return childProcess;

  async function treekill() {
    // Unfortunately on Linux `childProcess.kill()` won't kill all the children of the process. See also
    // https://github.com/sindresorhus/execa/pull/170#issuecomment-504143618 . To work around this, we kill all the
    // children by using node-tree-kill.
    childProcess.treekilled = true;
    const pid = childProcess.pid;
    if (pid) {
      await new Promise((resolve) => treeKill(pid, resolve));
    } else {
      childProcess.kill();
    }
  }

  // Print the logs with timestamps on failure or timeout, but not when the process was killed.
  function printLogOnFailure(e: ExecaError) {
    if (e.timedOut) {
      console.log(`'${e.command}' timed out. Output:`);
      console.log(childProcess.log);
    } else if (e.exitCode && !e.killed && !e.signal && !childProcess.treekilled) {
      console.log(`'${e.command}' failed with ${e.exitCode}. Output:`);
      console.log(childProcess.log);
    }
  }
}
