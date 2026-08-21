import { GET_FEED_DEFAULT_REQUEST, getFeedMetadataQueryOptions, getFeedQueryOptions } from '@/server/fetch/src/feed';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import SectionFeed from './-_section-feed';

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
  const { data: filteredFeed, isLoading } = useQuery(getFeedQueryOptions(filterProps));

  return (
    <SectionFeed
      {...feedMetadata}
      filters={filterProps}
      entries={filteredFeed?.entries ?? []}
      hasPreviousPage={filteredFeed?.hasPreviousPage || isLoading}
      hasNextPage={filteredFeed?.hasNextPage || isLoading}
      onTypesFilterChange={(types) => setFilterProps((prev) => ({ ...prev, types }))}
      onPublisherIdsFilterChange={(publisherIds) => setFilterProps((prev) => ({ ...prev, publisherIds }))}
      onPreviousPageClick={() => setFilterProps((prev) => ({ ...prev, page: prev.page - 1 }))}
      onNextPageClick={() => setFilterProps((prev) => ({ ...prev, page: prev.page + 1 }))}
      onPreviousPageHover={() => queryClient.prefetchQuery(getFeedQueryOptions({ ...filterProps, page: filterProps.page - 1 }))}
      onNextPageHover={() => queryClient.prefetchQuery(getFeedQueryOptions({ ...filterProps, page: filterProps.page + 1 }))}
    />
  );
}
