import * as Accordion from '@/components/accordion';
import { Avatar } from '@/components/avatar';
import Link from '@/components/link';
import { DateTime, Text } from '@/components/typography';
import type { GetFeedResponse } from '@/server/function/feed';

export type SectionInsideThisEditionProps = Pick<GetFeedResponse, 'entries'>;

export default function SectionInsideThisEdition({ entries }: SectionInsideThisEditionProps) {
  return (
    <section className="flex flex-col gap-12">
      <div className="border-gray-6 flex items-center justify-center border-y-4 border-double py-5">
        <Text as="h2" font="serif" size="1">
          INSIDE THIS EDITION
        </Text>
      </div>
      <Accordion.Root>
        {entries.map((entry) => (
          <Accordion.Item key={entry.url}>
            <Accordion.ItemHeader className="-mx-4 not-lg:*:py-6">
              <div className="px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <Text font="serif" variant="gray-soft" size="1">
                      {entry.thumbnailUrl ? 'VIDEO' : 'ARTICLE'}
                    </Text>
                    <Text variant="gray-soft" size="1">
                      //
                    </Text>
                    <DateTime value={entry.pubDate} font="serif" variant="gray-soft" size="1" />
                  </div>
                  <Link font="serif" variant="gray-soft" size="1" href={entry.sourceUrl} className="flex items-center gap-2">
                    {entry.source}
                    <Avatar size="1" src={entry.sourceLogoUrl} alt={entry.source.slice(0, 1)} />
                  </Link>
                </div>
                <Text className="max-w-none">{entry.title}</Text>
              </div>
            </Accordion.ItemHeader>
            <Accordion.ItemPanel>
              <div className="flex flex-col gap-4">
                <Text format="balance" variant="gray-soft" className="leading-6">
                  {entry.summary}
                </Text>
                <Link font="serif" variant="gray-soft" href={entry.url}>
                  {entry.thumbnailUrl ? 'Watch Video' : 'Read Article'}
                </Link>
              </div>
            </Accordion.ItemPanel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
