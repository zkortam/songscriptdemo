import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = get("SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(url, key, { auth: { persistSession: false } });

// 1. Does the table exist?
const { error: tErr, count } = await supabase
  .from("transcriptions")
  .select("*", { count: "exact", head: true });
console.log("table transcriptions:", tErr ? `MISSING -> ${tErr.message}` : `OK (${count} rows)`);

// 2. Does the storage bucket exist? Create it if not.
const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
if (bErr) {
  console.log("buckets: error ->", bErr.message);
} else if (buckets.some((b) => b.name === "midi")) {
  console.log("bucket midi: OK");
} else {
  const { error } = await supabase.storage.createBucket("midi", { public: true });
  console.log("bucket midi:", error ? `create failed -> ${error.message}` : "CREATED");
}
