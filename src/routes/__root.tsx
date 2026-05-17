import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import css from '../styles.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Cortex' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="selection:bg-accent-5 dark antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-1 text-gray-12 flex min-h-svh flex-col">
        <header></header>
        <main className="flex-1">{children}</main>
        <footer></footer>
        <Scripts />
      </body>
    </html>
  );
}
