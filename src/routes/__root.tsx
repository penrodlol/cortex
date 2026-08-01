import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import css from '../styles.css?url';
import Footer from './-_footer';
import Header from './-_header';
import * as Theme from './-_theme';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Cortex' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="selection:bg-accent-5 scrollbar scrollbar-gutter-stable antialiased">
      <head>
        <Theme.Script />
        <HeadContent />
      </head>
      <body className="from-gray-1 to-gray-2 text-gray-12 mx-auto flex min-h-svh max-w-7xl flex-col gap-16 bg-linear-to-tr bg-fixed px-8">
        <Theme.Provider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Scripts />
        </Theme.Provider>
      </body>
    </html>
  );
}
