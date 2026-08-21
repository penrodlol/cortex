import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { I18nProvider, useLocale } from 'react-aria-components/I18nProvider';
import css from '../styles.css?url';
import Error from './-_error';
import Footer from './-_footer';
import Header from './-_header';
import * as Layout from './-_layout';
import NotFound from './-_not-found';
import * as Theme from './-_theme';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Cortex' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  shellComponent: Shell,
  notFoundComponent: NotFound,
  errorComponent: Error,
});

function Shell(props: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ShellContent {...props} />
    </I18nProvider>
  );
}

function ShellContent(props: { children: React.ReactNode }) {
  const { locale, direction } = useLocale();

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className="selection:bg-accent-5 scrollbar scrollbar-gutter-stable antialiased"
    >
      <head>
        <Theme.Script />
        <HeadContent />
      </head>
      <Layout.Root as="body" className="from-gray-1 to-gray-2 text-gray-12 relative flex min-h-svh flex-col bg-linear-to-tr bg-fixed">
        <Theme.Provider>
          <Header />
          <main className="flex flex-1 flex-col" {...props} />
          <Footer />
          <Scripts />
        </Theme.Provider>
      </Layout.Root>
    </html>
  );
}
