import { Avatar } from '@/components/avatar';
import * as Card from '@/components/card';
import * as Collapsible from '@/components/collapsible';
import Link from '@/components/link';
import { Separator } from '@/components/separator';
import { DateTime, Text } from '@/components/typography';
import type { GetFeedResponse } from '@/server/function/feed';
import { Fragment } from 'react';

export type SectionTheFrontPageProps = { entries: GetFeedResponse['entries'] };

export default function SectionTheFrontPage({ entries }: SectionTheFrontPageProps) {
  return (
    <section className="grid gap-8 not-lg:mx-auto not-lg:max-w-prose not-lg:gap-y-12 lg:grid-cols-[60%_1fr_auto] lg:grid-rows-[auto_auto_1fr]">
      <Card.Root as="article" className="lg:row-span-full">
        <Card.Header>
          <Text font="serif" variant="gray-soft" size="2">
            {entries[0].thumbnailUrl ? 'VIDEO' : 'ARTICLE'}
          </Text>
          <Text variant="gray-soft" size="2">
            //
          </Text>
          <DateTime value={entries[0].pubDate} font="serif" variant="gray-soft" size="2" />
        </Card.Header>
        <Card.Content>
          <Text font="serif" format="balance" size="9">
            {entries[0].title}
          </Text>
          <Text format="balance" variant="gray-soft" className="leading-6">
            {entries[0].summary}
          </Text>
        </Card.Content>
        <Card.Footer>
          <Link font="serif" variant="gray-soft" href={entries[0].sourceUrl}>
            <Avatar size="1" src={entries[0].sourceLogoUrl} alt={entries[0].source.slice(0, 1)} />
            {entries[0].source}
          </Link>
          <Text variant="gray-soft">//</Text>
          <Link font="serif" variant="gray-soft" href={entries[0].url}>
            {entries[0].thumbnailUrl ? 'Watch Video' : 'Read Article'}
          </Link>
        </Card.Footer>
      </Card.Root>
      <Separator className="lg:row-span-full lg:h-full lg:w-px" />
      {entries.slice(1).map((entry, index) => (
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
            <Collapsible.Root as={Card.Content}>
              <Collapsible.Trigger overlay variant="gray-ghost" aria-label="Toggle summary" />
              <Collapsible.Content faded className="flex flex-col gap-4 data-collapsed:h-38">
                <Text font="serif" format="balance" size="6">
                  {entry.title}
                </Text>
                <Text format="balance" variant="gray-soft" size="2" className="leading-6">
                  {entry.summary}
                </Text>
              </Collapsible.Content>
            </Collapsible.Root>
            <Card.Footer>
              <Link font="serif" variant="gray-soft" size="2" href={entry.sourceUrl}>
                <Avatar size="1" src={entry.sourceLogoUrl} alt={entry.source.slice(0, 1)} />
                {entry.source}
              </Link>
              <Text variant="gray-soft" size="2">
                //
              </Text>
              <Link font="serif" variant="gray-soft" size="2" href={entry.url}>
                {entry.thumbnailUrl ? 'Watch Video' : 'Read Article'}
              </Link>
            </Card.Footer>
          </Card.Root>
        </Fragment>
      ))}
    </section>
  );
}
