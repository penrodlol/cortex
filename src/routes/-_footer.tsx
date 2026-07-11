import { Text } from '@/components/typography';

export default function Footer() {
  return (
    <footer className="border-gray-6 flex flex-wrap items-end justify-between gap-4 border-t-4 border-double py-8">
      <div>
        <Text italic font="serif" size="5" weight="9" className="tracking-tighter">
          Cortex Digital Archive
        </Text>
        <Text variant="gray-soft" size="2">
          A Developer Artifact Registry
        </Text>
      </div>
      <Text variant="gray-soft" size="2">
        &copy; {new Date().getFullYear()} Cortex Digital Archive. All rights reserved.
      </Text>
    </footer>
  );
}
