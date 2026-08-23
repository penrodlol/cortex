import Button from '#/components/button';
import { Text } from '#/components/typography';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import type { ErrorRouteComponent } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';

export default function Error({ reset }: React.ComponentProps<ErrorRouteComponent>) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-12 text-center">
      <div className="flex flex-wrap items-end justify-center gap-8">
        <Text trim font="serif" size="12" weight="8">
          500
        </Text>
        <Text trim font="serif" size="8" weight="8">
          Internal Server Error
        </Text>
      </div>
      <Text format="balance" variant="gray-soft">
        The system encountered an internal error and could not complete the request. Please try again in a few minutes.
      </Text>
      <Button variant="accent-ghost" onClick={async () => (queryErrorResetBoundary.reset(), await router.invalidate(), reset())}>
        Refresh Page
      </Button>
    </section>
  );
}
