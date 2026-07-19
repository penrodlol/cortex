import { GET_FEED_DEFAULT_REQUEST, getFeedMetadataQueryOptions, getFeedQueryOptions } from '@/server/fetch/src/feed';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import SectionFeed from './-_section-feed';
import SectionRecentFeed from './-_section-recent-feed';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async ({ context }) => {
    const feedMetadata = await context.queryClient.ensureQueryData(getFeedMetadataQueryOptions());
    const feedInitialFilterProps = { ...GET_FEED_DEFAULT_REQUEST, excludedUrls: feedMetadata.recentFeedEntries.map((entry) => entry.url) };
    const feed = await context.queryClient.ensureQueryData(getFeedQueryOptions(feedInitialFilterProps));
    return { feedMetadata, feedInitialFilterProps, feed };
  },
});

function Home() {
  const { feedMetadata, feedInitialFilterProps } = Route.useLoaderData();
  const { queryClient } = Route.useRouteContext();
  const [filterProps, setFilterProps] = useState(feedInitialFilterProps);
  const { data: filteredFeed, isLoading } = useQuery(getFeedQueryOptions(filterProps));

  return (
    <div className="flex flex-col gap-24">
      <SectionRecentFeed entries={feedMetadata.recentFeedEntries} />
      <SectionFeed
        types={feedMetadata.types}
        publishers={feedMetadata.publishers}
        hasPreviousPage={filteredFeed?.hasPreviousPage || isLoading}
        hasNextPage={filteredFeed?.hasNextPage || isLoading}
        entries={filteredFeed?.entries ?? []}
        onTypesFilterChange={(types) => setFilterProps((prev) => ({ ...prev, types }))}
        onPublisherIdsFilterChange={(publisherIds) => setFilterProps((prev) => ({ ...prev, publisherIds }))}
        onPreviousPageClick={() => setFilterProps((prev) => ({ ...prev, page: prev.page - 1 }))}
        onNextPageClick={() => setFilterProps((prev) => ({ ...prev, page: prev.page + 1 }))}
        onPreviousPageHover={() => queryClient.prefetchQuery(getFeedQueryOptions({ ...filterProps, page: filterProps.page - 1 }))}
        onNextPageHover={() => queryClient.prefetchQuery(getFeedQueryOptions({ ...filterProps, page: filterProps.page + 1 }))}
      />
    </div>
  );
}
