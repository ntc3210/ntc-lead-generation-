/** Runs before every test file: a throwaway data home (LEAD_SCOUT_HOME),
 * so no test touches the user's real my-company/ folder. */
import fs from "fs";
import os from "os";
import path from "path";

process.env.LEAD_SCOUT_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "lead-scout-home-"));
