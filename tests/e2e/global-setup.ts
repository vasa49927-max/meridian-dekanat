import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("npm run db:seed", { stdio: "inherit", env: { ...process.env, DEMO_NOW: process.env.DEMO_NOW ?? "2026-11-13T07:15:00Z" } });
}
