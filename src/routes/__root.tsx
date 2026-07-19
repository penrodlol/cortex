import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, ScriptOnce, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import css from '../styles.css?url';
import Footer from './-_footer';
import Header from './-_header';

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

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
        <ScriptOnce children={THEME_INIT_SCRIPT} />
        <HeadContent />
      </head>
      <body className="from-gray-1 to-gray-2 text-gray-12 mx-auto flex min-h-svh max-w-7xl flex-col gap-16 bg-linear-to-tr bg-fixed px-8">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Scripts />
      </body>
    </html>
  );
}
