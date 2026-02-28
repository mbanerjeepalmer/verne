import "dotenv/config";
import { Daytona } from "@daytonaio/sdk";

async function main() {
  const daytona = new Daytona();
  const { items: sandboxes } = await daytona.list();
  console.log(`Found ${sandboxes.length} sandboxes`);
  for (const sb of sandboxes) {
    console.log(`Deleting ${sb.id}...`);
    await sb.delete();
  }
  console.log("Done.");
}

main().catch(console.error);
