import { Text } from '@/components/typography';

export default function Header() {
  return (
    <header className="border-gray-6 flex justify-between gap-4 border-b-4 border-double py-4">
      <div>
        <Text italic font="serif" size="5" weight="9" className="tracking-tighter">
          Cortex Digital Archive
        </Text>
        <Text variant="gray-soft" size="2">
          A Developer Artifact Registry
        </Text>
      </div>
    </header>
  );
}
