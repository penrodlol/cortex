import Link from '#/components/link';
import { Text } from '#/components/typography';
import { useLocation } from '@tanstack/react-router';
import * as Layout from './-_layout';
import Search from './-_search';
import * as Theme from './-_theme';

export default function Header() {
  const { pathname } = useLocation();

  return (
    <Layout.Row as="header" variant="gray-soft-gradient" className="lg:bg-none">
      <Layout.Content className="flex justify-between gap-x-4 gap-y-2 p-8 not-lg:flex-col lg:items-center lg:px-12">
        <div className="not-lg:order-2">
          <Text italic font="serif" size="6" weight="9" className="tracking-tighter not-lg:text-3xl">
            Cortex Digital Archive
          </Text>
          <Text variant="gray-soft" className="not-lg:text-lg">
            A Developer Artifact Registry
          </Text>
        </div>
        <div className="flex items-center gap-4 not-lg:order-1">
          <Link variant={pathname === '/' ? 'gray' : 'gray-soft'} size="2" href="/">
            Home
          </Link>
          <Text variant="gray-soft" size="2">
            //
          </Text>
          <Link variant={pathname === '/repository' ? 'gray' : 'gray-soft'} size="2" href="/repository">
            Repository
          </Link>
        </div>
        <div className="flex gap-1 not-lg:order-3 not-lg:mt-4">
          <Search />
          <Theme.Trigger />
        </div>
      </Layout.Content>
    </Layout.Row>
  );
}
