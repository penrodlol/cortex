import { Avatar } from '@/components/avatar';
import Button from '@/components/button';
import * as Card from '@/components/card';
import * as Collapsible from '@/components/collapsible';
import Link from '@/components/link';
import SearchField from '@/components/searchfield';
import * as Select from '@/components/select';
import Surface from '@/components/surface';
import { DateTime, Text } from '@/components/typography';
import type { GetFeedMetadataResponse, GetFeedRequest, GetFeedResponse } from '@/server/fetch/src/feed';
import { memo, useCallback, useMemo, useState } from 'react';
import { useFilter } from 'react-aria-components/Autocomplete';
import { cn } from 'tailwind-variants';
import * as Layout from './-_layout';

export type SectionFeedProps = Partial<GetFeedMetadataResponse & GetFeedResponse> & {
  filters: GetFeedRequest;
  onTypesFilterChange: (types: GetFeedRequest['types']) => void;
  onPublisherIdsFilterChange: (publishers: GetFeedRequest['publisherIds']) => void;
  onPreviousPageClick: () => void;
  onNextPageClick: () => void;
  onPreviousPageHover: () => void;
  onNextPageHover: () => void;
};

export type SectionFeedEntryProps = {
  entry: GetFeedResponse['entries'][number];
  open: boolean;
  onOpenChange: (url: GetFeedResponse['entries'][number]['url'], open: boolean) => void;
};

export default function SectionFeed({
  types,
  publishers,
  filters,
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
  const { contains: publisherContains } = useFilter({ sensitivity: 'base' });
  const [openFeedItem, setOpenFeedItem] = useState<GetFeedResponse['entries'][number]['url']>();

  const handleOpenFeedItemChange = useCallback(
    (url: GetFeedResponse['entries'][number]['url'], open: boolean) => setOpenFeedItem(open ? url : undefined),
    [],
  );

  const noEntriesFound = useMemo(() => !entries?.length && (filters.types?.length || filters.publisherIds?.length), [entries, filters]);
  const chunkedEntries = useMemo(
    () => Array.from({ length: Math.ceil((entries?.length ?? 0) / 2) }, (_, i) => entries?.slice(i * 2, i * 2 + 2)),
    [entries],
  );

  return (
    <Surface as="section" className="flex flex-1 flex-col">
      <Layout.Row border="bottom">
        <Layout.Content className="grid lg:grid-cols-2">
          <Select.Root
            aria-label="Type filter"
            placeholder="Filter by type"
            selectionMode="multiple"
            value={filters.types ?? []}
            onChange={(event) => onTypesFilterChange(event as GetFeedRequest['types'])}
          >
            <Select.Trigger variant="gray-ghost" className="border-gray-6 h-18 px-8 not-lg:border-b lg:border-r lg:px-12" />
            <Select.Content crossOffset={12}>
              <Select.Items items={types?.map((type) => ({ name: type }))}>
                {(item) => <Select.Item id={item.name}>{item.name}</Select.Item>}
              </Select.Items>
            </Select.Content>
          </Select.Root>
          <Select.Root
            aria-label="Publisher filter"
            placeholder="Filter by publisher"
            selectionMode="multiple"
            value={filters.publisherIds ?? []}
            onChange={(event) => onPublisherIdsFilterChange(event as GetFeedRequest['publisherIds'])}
          >
            <Select.Trigger variant="gray-ghost" className="h-18 px-8 lg:px-12" />
            <Select.Content crossOffset={12} filterProps={{ filter: publisherContains }}>
              <SearchField aria-label="Search publishers" inputProps={{ placeholder: 'Search publishers' }} />
              <Select.Items itemsVirtualized={publishers}>{(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}</Select.Items>
            </Select.Content>
          </Select.Root>
        </Layout.Content>
      </Layout.Row>
      <Surface>
        {chunkedEntries.map((chunk, index) => (
          <Layout.Row key={index}>
            <Layout.Content className="grid lg:grid-cols-2">
              {chunk?.map((entry) => (
                <SectionFeedEntry key={entry.url} entry={entry} open={openFeedItem === entry.url} onOpenChange={handleOpenFeedItemChange} />
              ))}
            </Layout.Content>
          </Layout.Row>
        ))}
      </Surface>
      {noEntriesFound && (
        <Layout.Row className="flex-1">
          <Layout.Content className="mx-auto flex flex-col items-center justify-center gap-2 text-center">
            <Text italic font="serif" size="8">
              No Results Found
            </Text>
            <Text variant="gray-soft">No results were found for the selected filters</Text>
          </Layout.Content>
        </Layout.Row>
      )}
      <Layout.Row border="none" className={cn(!noEntriesFound && 'flex-1')}>
        <Layout.Content className="flex flex-wrap items-start justify-between gap-4 px-4 py-8 lg:px-8">
          <Button
            variant="gray-ghost"
            isDisabled={!hasPreviousPage}
            onClick={() => (window.scrollTo(0, 0), onPreviousPageClick())}
            onMouseEnter={() => hasPreviousPage && onPreviousPageHover()}
          >
            Previous
          </Button>
          <Button
            variant="gray-ghost"
            isDisabled={!hasNextPage}
            onClick={() => (window.scrollTo(0, 0), onNextPageClick())}
            onMouseEnter={() => hasNextPage && onNextPageHover()}
          >
            Next
          </Button>
        </Layout.Content>
      </Layout.Row>
    </Surface>
  );
}

const SectionFeedEntry = memo(({ entry, open, onOpenChange }: SectionFeedEntryProps) => (
  <Collapsible.Root open={open} onOpenChange={(open) => onOpenChange(entry.url, open)} className="flex [&_a]:relative [&_a]:z-20">
    <Collapsible.Trigger overlay aria-label={`Toggle ${entry.title}`} className="hover:bg-transparent" />
    <Card.Root className="border-gray-6 w-full px-8 py-12 not-lg:border-b lg:px-12 lg:group-first/collapsible:border-r">
      <Card.Header>
        <Text font="serif" variant="gray-soft" size="2">
          {entry.type}
        </Text>
        <Text variant="gray-soft" size="2">
          //
        </Text>
        <DateTime value={entry.pubDate} font="serif" variant="gray-soft" size="2" />
        <Link font="serif" variant="gray-soft" size="1" href={entry.sourceUrl} className="ml-auto flex items-center gap-2">
          <Avatar size="1" src={entry.sourceLogoUrl} alt={entry.sourceName.slice(0, 1)} />
          {entry.sourceName}
        </Link>
      </Card.Header>
      <Card.Content>
        <Text font="serif" format="balance" size="6" weight="6">
          {entry.title.toUpperCase()}
        </Text>
        <Collapsible.Content faded className="data-collapsed:h-20">
          <Text variant="gray-soft" format="balance" className="leading-6">
            {entry.summary}
          </Text>
        </Collapsible.Content>
      </Card.Content>
      <Card.Footer>
        <Link font="serif" variant="gray-soft" href={entry.url}>
          {entry.urlLabel}
        </Link>
      </Card.Footer>
    </Card.Root>
  </Collapsible.Root>
));
