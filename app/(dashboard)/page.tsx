import { ListPageContent } from './ListPageContent';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default function Home() {
  return <ListPageContent />;
}
