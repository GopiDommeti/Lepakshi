/**
 * Starts the API and the storefront together, in one terminal.
 *   npm run dev
 * Ctrl+C stops both.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const children = [];

function start(name, cwd, colour) {
  const child = spawn(npm, ["run", "dev"], {
    cwd: path.join(root, cwd),
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const label = `\x1b[${colour}m${name.padEnd(6)}\x1b[0m │ `;
  const write = (stream) => (chunk) => {
    for (const line of chunk.toString().split("\n")) {
      if (line.trim()) stream.write(label + line + "\n");
    }
  };
  child.stdout.on("data", write(process.stdout));
  child.stderr.on("data", write(process.stderr));
  child.on("exit", (code) => {
    if (code && code !== 0) console.log(`${label}exited with code ${code}`);
  });

  children.push(child);
  return child;
}

console.log("\n  Lepakshi Gold — starting API and storefront\n");
start("api", "server", "36");
setTimeout(() => start("web", "client", "33"), 900);

const stop = () => {
  for (const child of children) child.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
