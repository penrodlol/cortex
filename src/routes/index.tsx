import { GET_FEED_DEFAULT_REQUEST, GET_FEED_RECENT_SIZE, getFeedQueryOptions } from '@/server/function/feed';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import SectionInsideThisEdition from './-_section-inside-this-edition';
import SectionTheFrontPage from './-_section-the-front-page';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async ({ context }) => {
    const feed = await context.queryClient.ensureQueryData(getFeedQueryOptions(GET_FEED_DEFAULT_REQUEST));
    return { recentEntries: feed.entries.slice(0, GET_FEED_RECENT_SIZE) };
  },
});

function Home() {
  const { recentEntries } = Route.useLoaderData();
  const { queryClient } = Route.useRouteContext();
  const [page, setPage] = useState(GET_FEED_DEFAULT_REQUEST.page);
  const { data: feed, isLoading } = useQuery(getFeedQueryOptions({ page }));

  return (
    <div className="flex flex-col gap-24">
      <SectionTheFrontPage entries={recentEntries} />
      <SectionInsideThisEdition
        hasPrevPage={feed?.hasPrevPage || isLoading}
        hasNextPage={feed?.hasNextPage || isLoading}
        entries={(feed?.entries ?? []).slice(page === 1 ? GET_FEED_RECENT_SIZE : 0)}
        totalPages={feed?.totalPages ?? 0}
        page={page}
        onPrevPageClick={() => setPage((prev) => prev - 1)}
        onNextPageClick={() => setPage((prev) => prev + 1)}
        onPrevPageHover={() => queryClient.prefetchQuery(getFeedQueryOptions({ page: page - 1 }))}
        onNextPageHover={() => queryClient.prefetchQuery(getFeedQueryOptions({ page: page + 1 }))}
      />
    </div>
  );
}
