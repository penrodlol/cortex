import { Text } from '@/components/typography';
import Search from './-_search';

export default function Header() {
  return (
    <header className="border-gray-6 flex items-center justify-between gap-4 border-b-6 border-double py-4 not-lg:flex-col not-lg:pb-6">
      <div>
        <Text italic font="serif" size="5" weight="9" className="tracking-tighter not-lg:text-4xl">
          Cortex Digital Archive
        </Text>
        <Text variant="gray-soft" size="2" className="not-lg:text-xl">
          A Developer Artifact Registry
        </Text>
      </div>
      <Search />
    </header>
  );
}
