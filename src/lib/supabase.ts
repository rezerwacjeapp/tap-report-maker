import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iqlpnankcwiluvmollfr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbHBuYW5rY3dpbHV2bW9sbGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjA5MTMsImV4cCI6MjA4OTM5NjkxM30.kH184fIvvhNzdfLwMnRk8axyfcXoK_18dbMFS7gkn68";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
