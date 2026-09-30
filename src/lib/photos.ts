import { supabase } from "@/integrations/supabase/client";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function signedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, SEVEN_DAYS);
  return data?.signedUrl ?? null;
}
