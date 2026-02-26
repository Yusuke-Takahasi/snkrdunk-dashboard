'use server';

import { updateFeeSettings, updateListPreferences } from '../../../utils/appSettings';
import type { FeeSettings, ListPreferences } from '../../../utils/appSettings';

export async function saveFeeSettingsAction(
  feeSettings: FeeSettings
): Promise<{ error?: string }> {
  return updateFeeSettings(feeSettings);
}

export async function saveListPreferencesAction(
  listPreferences: ListPreferences
): Promise<{ error?: string }> {
  return updateListPreferences(listPreferences);
}
