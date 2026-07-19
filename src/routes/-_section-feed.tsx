import * as Accordion from '@/components/accordion';
import { Avatar } from '@/components/avatar';
import Button from '@/components/button';
import Link from '@/components/link';
import SearchField from '@/components/searchfield';
import * as Select from '@/components/select';
import { DateTime, Text } from '@/components/typography';
import type { GetFeedMetadataResponse, GetFeedRequest, GetFeedResponse } from '@/server/fetch/src/feed';
import { useRef } from 'react';
import { useFilter } from 'react-aria-components/Autocomplete';

export type SectionFeedProps = Partial<GetFeedMetadataResponse & GetFeedResponse> & {
  onTypesFilterChange: (types: GetFeedRequest['types']) => void;
  onPublisherIdsFilterChange: (publishers: GetFeedRequest['publisherIds']) => void;
  onPreviousPageClick: () => void;
  onNextPageClick: () => void;
  onPreviousPageHover: () => void;
  onNextPageHover: () => void;
};

export default function SectionFeed({
  types,
  publishers,
  entries,
  hasPreviousPage,
  hasNextPage,
  onTypesFilterChange,
  onPublisherIdsFilterChange,
  onPreviousPageClick,
  onNextPageClick,
  onPreviousPageHover,
  onNextPageHover,
}: SectionFeedProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { contains: publisherContains } = useFilter({ sensitivity: 'base' });

  return (
    <section ref={sectionRef} className="flex scroll-mt-12 flex-col gap-12">
      <div className="border-gray-6 flex items-center justify-end gap-8 border-y-4 border-double py-4">
        <Select.Root
          aria-label="Publisher filter"
          placeholder="Filter by type"
          selectionMode="multiple"
          onChange={(event) => onTypesFilterChange(event as GetFeedRequest['types'])}
        >
          <Select.Trigger variant="gray-soft" className="w-50" />
          <Select.Content>
            <Select.Items items={types?.map((type) => ({ name: type }))}>
              {(item) => <Select.Item id={item.name}>{item.name}</Select.Item>}
            </Select.Items>
          </Select.Content>
        </Select.Root>
        <Select.Root
          aria-label="Publisher filter"
          placeholder="Filter by publisher"
          selectionMode="multiple"
          onChange={(event) => onPublisherIdsFilterChange(event as GetFeedRequest['publisherIds'])}
        >
          <Select.Trigger variant="gray-soft" className="w-60" />
          <Select.Content filterProps={{ filter: publisherContains }}>
            <SearchField aria-label="Search publishers" inputProps={{ placeholder: 'Search publishers' }} />
            <Select.Items itemsVirtualized={publishers}>{(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}</Select.Items>
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col gap-12">
        <Accordion.Root>
          {entries?.map((entry) => (
            <Accordion.Item key={entry.url}>
              <Accordion.ItemHeader className="-mx-4 not-lg:*:py-6">
                <div className="px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <Text font="serif" variant="gray-soft" size="1">
                        {entry.type.toUpperCase()}
                      </Text>
                      <Text variant="gray-soft" size="1">
                        //
                      </Text>
                      <DateTime value={entry.pubDate} font="serif" variant="gray-soft" size="1" />
                    </div>
                    <Link font="serif" variant="gray-soft" size="1" href={entry.sourceUrl} className="flex items-center gap-2">
                      {entry.sourceName}
                      <Avatar size="1" src={entry.sourceLogoUrl} alt={entry.sourceName.slice(0, 1)} />
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
                    {entry.urlLabel}
                  </Link>
                </div>
              </Accordion.ItemPanel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
        <div className="-mx-4 flex items-center justify-end lg:justify-between">
          <Button
            variant="gray-ghost"
            isDisabled={!hasPreviousPage}
            onClick={() => (sectionRef.current?.scrollIntoView(), onPreviousPageClick())}
            onMouseEnter={() => hasPreviousPage && onPreviousPageHover()}
          >
            Previous
          </Button>
          <Button
            variant="gray-ghost"
            isDisabled={!hasNextPage}
            onClick={() => (sectionRef.current?.scrollIntoView(), onNextPageClick())}
            onMouseEnter={() => hasNextPage && onNextPageHover()}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
