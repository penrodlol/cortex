import { Text } from '@/components/typography';
import * as Layout from './-_layout';
import Search from './-_search';
import * as Theme from './-_theme';

export default function Header() {
  return (
    <Layout.Row as="header">
      <Layout.Content className="flex justify-between gap-4 p-8 not-lg:flex-col lg:items-center lg:px-12">
        <div>
          <Text italic font="serif" size="6" weight="9" className="tracking-tighter not-lg:text-3xl">
            Cortex Digital Archive
          </Text>
          <Text variant="gray-soft" className="not-lg:text-lg">
            A Developer Artifact Registry
          </Text>
        </div>
        <div className="flex gap-1">
          <Search />
          <Theme.Trigger />
        </div>
      </Layout.Content>
    </Layout.Row>
  );
}
