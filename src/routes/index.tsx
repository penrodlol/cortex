import * as Audio from '#/components/audio';
import { Avatar } from '#/components/avatar';
import Button from '#/components/button';
import * as Card from '#/components/card';
import * as Collapsible from '#/components/collapsible';
import Link from '#/components/link';
import SearchField from '#/components/searchfield';
import * as Select from '#/components/select';
import Surface from '#/components/surface';
import { DateTime, Text } from '#/components/typography';
import type { GetFeedRequest } from '#/server/fetch/src/feed';
import { GET_FEED_DEFAULT_REQUEST, getFeedMetadataQueryOptions, getFeedQueryOptions } from '#/server/fetch/src/feed';
import { GET_SUMMARY_AUDIO_DEFAULT_REQUEST, getSummaryAudioQueryOptions } from '#/server/fetch/src/summary-audio';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useFilter } from 'react-aria-components/Autocomplete';
import * as Layout from './-_layout';

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async ({ context }) => {
    const summaryAudioInitialProps = { ...GET_SUMMARY_AUDIO_DEFAULT_REQUEST };
    const feedInitialFilterProps = { ...GET_FEED_DEFAULT_REQUEST };
    const [_, feedMetadata] = await Promise.all([
      context.queryClient.ensureQueryData(getSummaryAudioQueryOptions(summaryAudioInitialProps)),
      context.queryClient.ensureQueryData(getFeedMetadataQueryOptions()),
      context.queryClient.ensureQueryData(getFeedQueryOptions(feedInitialFilterProps)),
    ]);
    return { summaryAudioInitialProps, feedMetadata, feedInitialFilterProps };
  },
});

function HomePage() {
  const { summaryAudioInitialProps, feedMetadata, feedInitialFilterProps } = Route.useLoaderData();
  const { queryClient } = Route.useRouteContext();
  const [summaryAudioProps, setSummaryAudioProps] = useState(summaryAudioInitialProps);
  const [feedFilterProps, setFeedFilterProps] = useState(feedInitialFilterProps);
  const summaryAudio = useQuery(getSummaryAudioQueryOptions(summaryAudioProps));
  const feed = useQuery(getFeedQueryOptions(feedFilterProps));
  const { contains: feedPublisherContains } = useFilter({ sensitivity: 'base' });

  return (
    <>
      <Layout.Section
        headers={[
          () =>
            summaryAudio.data && (
              <Surface className="col-span-2 flex h-18">
                <Button
                  variant="gray-ghost"
                  animate={false}
                  size="3-icon"
                  aria-label="Previous summary audio"
                  icon={{ source: <CaretLeftIcon /> }}
                  className="h-full w-14 lg:w-18"
                  isDisabled={!summaryAudio.data?.previous || summaryAudio.isLoading || summaryAudio.isFetching}
                  onPress={() => summaryAudio.data?.previous && setSummaryAudioProps({ id: summaryAudio.data.previous })}
                  onMouseOver={() =>
                    summaryAudio?.data?.previous &&
                    queryClient.prefetchQuery(getSummaryAudioQueryOptions({ id: summaryAudio.data.previous }))
                  }
                />
                <Audio.Root
                  src={summaryAudio.data.audioUrl}
                  className="border-gray-6 flex flex-1 gap-2 border-x pr-4 pl-2 lg:pr-12 lg:pl-10"
                >
                  <Audio.WaveformSlider peaks={summaryAudio.data.audioPeaks} className="absolute inset-0 z-10" />
                  <Audio.Trigger variant="gray-ghost" size="3-icon" className="relative z-20" />
                  <Audio.Label className="pointer-events-none relative z-20 flex select-none *:first:sr-only">
                    <Text as="span">Summary for</Text>
                    <DateTime trim font="serif" size="2" value={summaryAudio.data.createdAt} />
                  </Audio.Label>
                  <Audio.Time
                    trim
                    variant="gray-soft"
                    size="1"
                    weight="6"
                    className="pointer-events-none relative z-20 ml-auto select-none"
                  />
                </Audio.Root>
                <Button
                  variant="gray-ghost"
                  animate={false}
                  size="3-icon"
                  aria-label="Next summary audio"
                  icon={{ source: <CaretRightIcon /> }}
                  className="h-full w-14 lg:w-18"
                  isDisabled={!summaryAudio.data?.next || summaryAudio.isLoading || summaryAudio.isFetching}
                  onPress={() => summaryAudio.data?.next && setSummaryAudioProps({ id: summaryAudio.data.next })}
                  onMouseOver={() =>
                    summaryAudio?.data?.next && queryClient.prefetchQuery(getSummaryAudioQueryOptions({ id: summaryAudio.data.next }))
                  }
                />
              </Surface>
            ),
          () => (
            <>
              <Select.Root
                aria-label="Type filter"
                placeholder="Filter by type"
                selectionMode="multiple"
                value={feedFilterProps.types ?? []}
                onChange={(e) => setFeedFilterProps((prev) => ({ ...prev, types: e as GetFeedRequest['types'], page: 1 }))}
              >
                <Select.Trigger variant="gray-ghost" className="border-gray-6 h-14 px-8 not-lg:border-b lg:h-18 lg:border-r lg:px-12" />
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
                value={feedFilterProps.publisherIds ?? []}
                onChange={(e) => setFeedFilterProps((prev) => ({ ...prev, publisherIds: e as GetFeedRequest['publisherIds'], page: 1 }))}
              >
                <Select.Trigger variant="gray-ghost" className="h-14 px-8 lg:h-18 lg:px-12" />
                <Select.Content crossOffset={12} filterProps={{ filter: feedPublisherContains }}>
                  <SearchField aria-label="Search publishers" inputProps={{ placeholder: 'Search publishers' }} />
                  <Select.Items itemsVirtualized={feedMetadata.publishers}>
                    {(item) => <Select.Item id={item.id}>{item.name}</Select.Item>}
                  </Select.Items>
                </Select.Content>
              </Select.Root>
            </>
          ),
        ]}
        content={{
          entries: feed?.data?.entries ?? [],
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
              isDisabled={!feed?.data?.hasPreviousPage || feed?.isLoading || feed?.isFetching}
              onPress={() => (window.scrollTo(0, 0), setFeedFilterProps((prev) => ({ ...prev, page: prev.page - 1 })))}
              className="my-8 ml-8 max-w-max justify-self-start"
            >
              Previous
            </Button>
            <Button
              variant="gray-ghost"
              isDisabled={!feed?.data?.hasNextPage || feed?.isLoading || feed?.isFetching}
              onPress={() => (window.scrollTo(0, 0), setFeedFilterProps((prev) => ({ ...prev, page: prev.page + 1 })))}
              onMouseEnter={() =>
                feed?.data?.hasNextPage &&
                queryClient.prefetchQuery(getFeedQueryOptions({ ...feedFilterProps, page: feedFilterProps.page + 1 }))
              }
              className="my-8 mr-8 max-w-max justify-self-end"
            >
              Next
            </Button>
          </>
        )}
      />
    </>
  );
}
