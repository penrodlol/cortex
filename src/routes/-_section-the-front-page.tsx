import * as Card from '@/components/card';
import { Separator } from '@/components/separator';
import { DateTime, Text } from '@/components/typography';
import type { GetFeedResponse } from '@/server/function/feed';
import { Fragment } from 'react';

export type SectionTheFrontPageProps = { latestEntry: GetFeedResponse['entries'][number]; entries: GetFeedResponse['entries'] };

export default function SectionTheFrontPage({ latestEntry, entries }: SectionTheFrontPageProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="border-gray-6 flex items-center justify-center border-y-3 border-double py-4">
        <Text as="h2" font="serif" size="1">
          THE FRONT PAGE
        </Text>
      </div>
      <div className="grid gap-x-8 gap-y-4 not-lg:mx-auto not-lg:max-w-prose lg:grid-cols-[60%_1fr_auto] lg:grid-rows-[repeat(3,auto)]">
        <Card.Root as="article" className="lg:row-span-full">
          <Card.Header>
            <Text font="serif" variant="gray-soft" size="2">
              {latestEntry.thumbnailUrl ? 'VIDEO' : 'ARTICLE'}
            </Text>
            <Text variant="gray-soft" size="2">
              //
            </Text>
            <DateTime value={latestEntry.pubDate} font="serif" variant="gray-soft" size="2" />
          </Card.Header>
          <Card.Content>
            <Text font="serif" format="balance" size="9">
              {latestEntry.title}
            </Text>
            <Text format="balance" variant="gray-soft" className="leading-6">
              {latestEntry.summary}
            </Text>
          </Card.Content>
          <Card.Footer>
            <Text font="serif" variant="gray-soft">
              {latestEntry.source}
            </Text>
          </Card.Footer>
        </Card.Root>
        <Separator className="lg:row-span-full lg:h-full lg:w-px" />
        {entries.map((entry, index) => (
          <Fragment key={entry.url}>
            {index > 0 && <Separator />}
            <Card.Root as="article">
              <Card.Header>
                <Text font="serif" variant="gray-soft" size="1">
                  {entry.thumbnailUrl ? 'VIDEO' : 'ARTICLE'}
                </Text>
                <Text variant="gray-soft" size="1">
                  //
                </Text>
                <DateTime value={entry.pubDate} font="serif" variant="gray-soft" size="1" />
              </Card.Header>
              <Card.Content className="gap-4">
                <Text font="serif" format="balance" size="6">
                  {entry.title}
                </Text>
                <Text format="balance" variant="gray-soft" size="2" className="line-clamp-3 leading-6">
                  {entry.summary}
                </Text>
              </Card.Content>
              <Card.Footer>
                <Text font="serif" variant="gray-soft" size="2">
                  {entry.source}
                </Text>
              </Card.Footer>
            </Card.Root>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
