export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SKIP_STARTUP !== "1") {
    const { runStartup } = await import("./server/startup");
    await runStartup();
  }
}
