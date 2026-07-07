// Wipe all local profiles, sessions, and artifacts. Fresh island.
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "db.json");
if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
  console.log("Cartograph data reset. The fog has rolled back in.");
} else {
  console.log("Nothing to reset \u2014 the map was already blank.");
}
