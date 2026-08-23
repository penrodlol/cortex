import Link from '#/components/link';
import { Text } from '#/components/typography';

export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-12 text-center">
      <div className="flex flex-wrap items-end justify-center gap-8">
        <Text trim font="serif" size="12" weight="8">
          404
        </Text>
        <Text trim font="serif" size="8" weight="8">
          Page Not Found
        </Text>
      </div>
      <Text format="balance" variant="gray-soft">
        This page does not exist within the digital archive. It may have been removed, had its name changed, or is temporarily unavailable.
      </Text>
      <Link href="/" size="3">
        Return to Front Page
      </Link>
    </section>
  );
}
