import { GET_FEED_DEFAULT_REQUEST, getFeedQueryOptions } from '@/server/function/feed';
import { createFileRoute } from '@tanstack/react-router';
import SectionInsideThisEdition from './-_section-inside-this-edition';
import SectionTheFrontPage from './-_section-the-front-page';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async ({ context }) => {
    const feed = await context.queryClient.ensureQueryData(getFeedQueryOptions(GET_FEED_DEFAULT_REQUEST));
    return { feed };
  },
});

function Home() {
  const { feed } = Route.useLoaderData();

  return (
    <div className="mx-auto my-24 flex max-w-7xl flex-col gap-24 px-8">
      <SectionTheFrontPage latestEntry={feed.entries[0]} entries={feed.entries.slice(1, 3)} />
      <SectionInsideThisEdition entries={feed.entries.slice(3)} />
    </div>
  );
}
