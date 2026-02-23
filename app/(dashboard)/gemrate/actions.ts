'use server';

import { supabase } from '../../../utils/supabase';

export async function upsertGemrateMapping(seriesName: string, gemrateUrl: string) {
  const trimmedName = seriesName.trim();
  const trimmedUrl = gemrateUrl.trim();
  if (!trimmedName || !trimmedUrl) throw new Error('パック名とURLを入力してください');
  const { error } = await supabase.from('gemrate_mappings').upsert(
    { series_name: trimmedName, gemrate_url: trimmedUrl },
    { onConflict: 'series_name' }
  );
  if (error) throw new Error(error.message);
}
