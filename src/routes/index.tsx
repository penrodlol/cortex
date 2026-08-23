import { Avatar } from '#/components/avatar';
import Button from '#/components/button';
import * as Card from '#/components/card';
import * as Collapsible from '#/components/collapsible';
import Link from '#/components/link';
import SearchField from '#/components/searchfield';
import * as Select from '#/components/select';
import { DateTime, Text } from '#/components/typography';
import type { GetFeedRequest } from '#/server/fetch/src/feed';
import { GET_FEED_DEFAULT_REQUEST, getFeedMetadataQueryOptions, getFeedQueryOptions } from '#/server/fetch/src/feed';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useFilter } from 'react-aria-components/Autocomplete';
import * as Layout from './-_layout';

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async ({ context }) => {
    const feedInitialFilterProps = { ...GET_FEED_DEFAULT_REQUEST };
    const [feedMetadata, feed] = await Promise.all([
      context.queryClient.ensureQueryData(getFeedMetadataQueryOptions()),
      context.queryClient.ensureQueryData(getFeedQueryOptions(feedInitialFilterProps)),
    ]);
    return { feedMetadata, feedInitialFilterProps, feed };
  },
});

function HomePage() {
  const { feedMetadata, feedInitialFilterProps } = Route.useLoaderData();
  const { queryClient } = Route.useRouteContext();
  const [filterProps, setFilterProps] = useState(feedInitialFilterProps);
  const { data: filteredFeed, isLoading, isFetching } = useQuery(getFeedQueryOptions(filterProps));
  const { contains: publisherContains } = useFilter({ sensitivity: 'base' });

  return (
    <Layout.Section
      header={() => (
        <>
          <Select.Root
            aria-label="Type filter"
            placeholder="Filter by type"
            selectionMode="multiple"
            value={filterProps.types ?? []}
            onChange={(e) => setFilterProps((prev) => ({ ...prev, types: e as GetFeedRequest['types'], page: 1 }))}
          >
            <Select.Trigger variant="gray-ghost" className="border-gray-6 h-18 px-8 not-lg:border-b lg:border-r lg:px-12" />
            <Select.Content crossOffset={12}>
              <Select.Items items={feedMetadata.types.map((type) => ({ id: type, name: type }))}>
                {(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}
              </Select.Items>
            </Select.Content>
          </Select.Root>
          <Select.Root
            aria-label="Publisher filter"
            placeholder="Filter by publisher"
            selectionMode="multiple"
            value={filterProps.publisherIds ?? []}
            onChange={(e) => setFilterProps((prev) => ({ ...prev, publisherIds: e as GetFeedRequest['publisherIds'], page: 1 }))}
          >
            <Select.Trigger variant="gray-ghost" className="h-18 px-8 lg:px-12" />
            <Select.Content crossOffset={12} filterProps={{ filter: publisherContains }}>
              <SearchField aria-label="Search publishers" inputProps={{ placeholder: 'Search publishers' }} />
              <Select.Items itemsVirtualized={feedMetadata.publishers}>
                {(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}
              </Select.Items>
            </Select.Content>
          </Select.Root>
        </>
      )}
      content={{
        entries: filteredFeed?.entries ?? [],
        keyIdentifier: (entry) => entry.url,
        noEntriesFound: () => (
          <Layout.Row className="flex-1">
            <Layout.Content className="mx-auto flex flex-col items-center justify-center gap-2 text-center">
              <Text italic font="serif" size="8">
                No Results Found
              </Text>
              <Text variant="gray-soft">No results were found for the selected filters</Text>
            </Layout.Content>
          </Layout.Row>
        ),
        render: (entry, { openEntry, setOpenEntry }) => (
          <Collapsible.Root
            open={openEntry === entry.url}
            onOpenChange={(open) => setOpenEntry(open ? entry.url : undefined)}
            className="flex [&_a]:relative [&_a]:z-20"
          >
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
        ),
      }}
      footer={() => (
        <>
          <Button
            variant="gray-ghost"
            isDisabled={!filteredFeed?.hasPreviousPage || isLoading || isFetching}
            onClick={() => (window.scrollTo(0, 0), setFilterProps((prev) => ({ ...prev, page: prev.page - 1 })))}
            className="my-8 ml-8 max-w-max justify-self-start"
          >
            Previous
          </Button>
          <Button
            variant="gray-ghost"
            isDisabled={!filteredFeed?.hasNextPage || isLoading || isFetching}
            onClick={() => (window.scrollTo(0, 0), setFilterProps((prev) => ({ ...prev, page: prev.page + 1 })))}
            onMouseEnter={() =>
              filteredFeed?.hasNextPage &&
              !isLoading &&
              !isFetching &&
              queryClient.prefetchQuery(getFeedQueryOptions({ ...filterProps, page: filterProps.page + 1 }))
            }
            className="my-8 mr-8 max-w-max justify-self-end"
          >
            Next
          </Button>
        </>
      )}
    />
  );
}
