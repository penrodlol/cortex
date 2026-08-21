import { Text } from '@/components/typography';
import * as Layout from './-_layout';

export default function Footer() {
  return (
    <Layout.Row as="footer" border="top">
      <Layout.Content className="flex flex-wrap items-end justify-between gap-4 p-8 lg:px-12">
        <div>
          <Text italic font="serif" size="5" weight="9" className="tracking-tighter">
            Cortex Digital Archive
          </Text>
          <Text variant="gray-soft" size="2">
            A Developer Artifact Registry
          </Text>
        </div>
        <Text variant="gray-soft" size="2">
          &copy; {new Date().getFullYear()} Cortex Digital Archive. All rights reserved.
        </Text>
      </Layout.Content>
    </Layout.Row>
  );
}
