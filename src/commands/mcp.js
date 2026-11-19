import { startMcpServer } from '../mcp/server.js';

export async function runMcp(ctx) {
  const server = startMcpServer();
  if (process.stdin.isTTY && !ctx.json) {
    process.stderr.write('[modelpick] waiting for MCP messages on stdin (Ctrl+C to stop)\n');
  }
  await new Promise((resolve) => {
    server.rl.on('close', resolve);
    process.on('SIGINT', () => {
      server.rl.close();
      resolve();
    });
    process.on('SIGTERM', () => {
      server.rl.close();
      resolve();
    });
  });
}
