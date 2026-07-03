import { Text } from '@/components/typography';
import type { GetFeedResponse } from '@/server/function/feed';

export type SectionInsideThisEditionProps = { entries: GetFeedResponse['entries'] };

export default function SectionInsideThisEdition({ entries }: SectionInsideThisEditionProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="border-gray-6 flex items-center justify-center border-y-3 border-double py-4">
        <Text as="h2" font="serif" size="1">
          INSIDE THIS EDITION
        </Text>
      </div>
    </section>
  );
}
