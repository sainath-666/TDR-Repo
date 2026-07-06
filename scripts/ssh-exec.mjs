#!/usr/bin/env node
/**
 * One-off SSH command runner (password auth). Usage:
 *   node scripts/ssh-exec.mjs "command here"
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '52.140.48.93';
const user = process.env.SSH_USER || 'cloveadmin';
const password = process.env.SSH_PASSWORD;
const command = process.argv.slice(2).join(' ');

if (!password) {
  console.error('SSH_PASSWORD is required');
  process.exit(1);
}
if (!command) {
  console.error('Usage: node scripts/ssh-exec.mjs "<command>"');
  process.exit(1);
}

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(command, (err, stream) => {
      if (err) {
        console.error(err);
        conn.end();
        process.exit(1);
      }
      let code = 0;
      stream
        .on('close', (exitCode) => {
          code = exitCode ?? 0;
          conn.end();
          process.exit(code);
        })
        .on('data', (d) => process.stdout.write(d))
        .stderr.on('data', (d) => process.stderr.write(d));
    });
  })
  .on('error', (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: user, password, readyTimeout: 30000 });
