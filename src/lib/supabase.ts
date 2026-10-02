import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iqlpnankcwiluvmollfr.supabase.co";
// Klucz publiczny (publishable) - jawny z założenia, dostęp do danych chroni RLS.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Go7Y8URho0Sdf7XRo2OJCQ_b-HyMVFV";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
