import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const output = resolve("dist");
const target = process.env.XAMPP_HTDOCS
  ? resolve(process.env.XAMPP_HTDOCS, "tanganedukasi")
  : "C:\\xampp\\htdocs\\tanganedukasi";
const htdocs = resolve(target, "..");
const privateDirectory = resolve(htdocs, "tanganedukasi-private");
const databaseConfig = resolve(privateDirectory, "database.php");
const schemaPath = resolve("database", "schema.sql");

if (!existsSync(resolve(output, "index.html"))) {
  throw new Error("Build output is missing. Run the production build before deployment.");
}

mkdirSync(target, { recursive: true });
cpSync(output, target, { recursive: true, force: true });
mkdirSync(privateDirectory, { recursive: true });
const privateHtaccess = resolve(privateDirectory, ".htaccess");
if (!existsSync(privateHtaccess)) {
  writeFileSync(
    privateHtaccess,
    `<IfModule mod_authz_core.c>
  Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
  Order allow,deny
  Deny from all
</IfModule>
`,
    { flag: "wx" },
  );
}
cpSync(schemaPath, resolve(privateDirectory, "schema.sql"), { force: true });

const mysqlPath = process.env.XAMPP_MYSQL
  ? resolve(process.env.XAMPP_MYSQL)
  : "C:\\xampp\\mysql\\bin\\mysql.exe";
if (!existsSync(mysqlPath)) {
  throw new Error(`MySQL client not found at ${mysqlPath}. Set XAMPP_MYSQL to your mysql.exe path.`);
}
const setup = spawnSync(
  mysqlPath,
  ["--host=127.0.0.1", "--user=root", "--default-character-set=utf8mb4"],
  { input: readFileSync(schemaPath), encoding: "utf8", windowsHide: true },
);
if (setup.error || setup.status !== 0) {
  const reason = setup.error?.message || setup.stderr?.trim() || `exit code ${setup.status}`;
  throw new Error(
    `Could not initialize MySQL database (${reason}). Import ${resolve(privateDirectory, "schema.sql")} in phpMyAdmin, then configure ${databaseConfig}.`,
  );
}

let configText = existsSync(databaseConfig) ? readFileSync(databaseConfig, "utf8") : "";
const isDefaultRootConfig = !configText ||
  (/['"]username['"]\s*=>\s*['"]root['"]/.test(configText) &&
    /['"]password['"]\s*=>\s*['"]['"]/.test(configText));
if (isDefaultRootConfig) {
  const existingPassword = configText.match(/['"]password['"]\s*=>\s*['"]([a-f0-9]{64})['"]/i)?.[1];
  const appPassword = existingPassword || randomBytes(32).toString("hex");
  const grantSql = [
    `CREATE USER IF NOT EXISTS 'tangan_app'@'127.0.0.1' IDENTIFIED BY '${appPassword}';`,
    "GRANT SELECT, INSERT, DELETE ON tangan_edukasi.clean_logs TO 'tangan_app'@'127.0.0.1';",
    "FLUSH PRIVILEGES;",
  ].join("\n");
  const grant = spawnSync(
    mysqlPath,
    ["--host=127.0.0.1", "--user=root", "--default-character-set=utf8mb4", "--execute", grantSql],
    { encoding: "utf8", windowsHide: true },
  );
  if (grant.error || grant.status !== 0) {
    const reason = grant.error?.message || grant.stderr?.trim() || `exit code ${grant.status}`;
    throw new Error(`Could not create the limited database user (${reason}). Verify the XAMPP MySQL root account.`);
  }

  writeFileSync(
    databaseConfig,
    `<?php
return [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'tangan_edukasi',
    'username' => 'tangan_app',
    'password' => '${appPassword}',
];
`,
  );
}

console.log(`Deployed Tangan Edukasi to ${target}`);
console.log("MySQL database initialized with a restricted application user.");
console.log("Open http://localhost/tanganedukasi/");
