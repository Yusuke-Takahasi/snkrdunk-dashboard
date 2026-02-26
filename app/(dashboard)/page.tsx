import { getAppSettings, getListPreferences } from '../../utils/appSettings';
import { ListPageContent } from './ListPageContent';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Home() {
  const appSettings = await getAppSettings();
  const defaultListPreferences = getListPreferences(appSettings);
  return <ListPageContent defaultListPreferences={defaultListPreferences} />;
}
