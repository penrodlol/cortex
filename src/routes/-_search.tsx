import * as Accordion from '@/components/accordion';
import { Avatar } from '@/components/avatar';
import Button from '@/components/button';
import * as Dialog from '@/components/dialog';
import Kbd from '@/components/kbd';
import Link from '@/components/link';
import SearchField from '@/components/searchfield';
import Spinner from '@/components/spinner';
import { DateTime, Text } from '@/components/typography';
import { getFeedByQueryQueryOptions } from '@/server/fetch/src/feed';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from 'tailwind-variants';

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);

  useHotkey('Mod+K', () => setIsOpen((open) => !open), { enabled: !isOpen });

  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button animate={false} variant="gray-ghost-outline" size="1" className="not-lg:w-full" icon={{ source: <SearchIcon /> }}>
        Search
        <Kbd variant="gray-surface-outline" size="1" className="ml-8 not-lg:hidden">
          ⌘K
        </Kbd>
      </Button>
      <Dialog.Portal
        size="3"
        align="top"
        isDismissable
        modalContainerProps={{ className: 'not-lg:pb-0 not-lg:pt-20' }}
        modalProps={{ className: 'not-lg:max-h-(--visual-viewport-height) not-lg:h-full not-lg:min-w-full' }}
      >
        <Dialog.Content
          variant="gray-surface-outline-gradient"
          className="not-lg:bdg-none relative flex flex-col overflow-hidden not-lg:h-full not-lg:border-x-0 not-lg:border-t! not-lg:border-b-0"
        >
          <SearchContent />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchContent() {
  const [debouncedQuery, queryDebouncer] = useDebouncedValue('', { wait: 200 });
  const { data, isFetching } = useQuery(getFeedByQueryQueryOptions({ query: debouncedQuery }));

  return (
    <>
      <SearchField
        autoFocus
        aria-label="Search"
        variant="gray-ghost"
        inputProps={{ placeholder: 'Search...', enterKeyHint: 'search', className: 'pr-24 pl-10' }}
        iconProps={isFetching ? { source: <Spinner />, className: 'right-16 starting:opacity-0 opacity-100 delay-200' } : undefined}
        clearButtonProps={{ className: 'right-6' }}
        onChange={queryDebouncer.maybeExecute}
        className="h-20 shrink-0"
      />
      {data?.entries.length === 0 && debouncedQuery.length > 0 && !isFetching && (
        <div className="flex h-full flex-col items-center justify-center lg:pb-12">
          <Text font="serif" size="6" weight="6">
            No Results Found
          </Text>
          <Text variant="gray-soft" size="2">
            Try searching for another keyword or phrase
          </Text>
        </div>
      )}
      {debouncedQuery.length > 0 && (
        <Accordion.Root
          className={cn(
            'scrollbar scroll-mask scrollbar-gutter-both overflow-auto',
            '**:[mark]:text-gray-12 **:[mark]:bg-transparent **:[mark]:px-1 **:[mark]:font-bold',
            '**:[mark]:decoration-accent-9 **:[mark]:underline **:[mark]:underline-offset-4',
          )}
        >
          {data?.entries.map((entry) => (
            <Accordion.Item key={entry.url} className="last:pb-2">
              <Accordion.ItemHeader>
                <div className="flex flex-col gap-2 px-8 py-6 group-first/accordion-item:pt-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <Text font="serif" variant="gray-soft" size="1">
                        {entry.type.toUpperCase()}
                      </Text>
                      <Text variant="gray-soft" size="1">
                        //
                      </Text>
                      <DateTime value={entry.pubDate} font="serif" variant="gray-soft" size="1" />
                      <Link font="serif" variant="gray-soft" size="1" href={entry.sourceUrl} className="ml-auto flex items-center gap-2">
                        {entry.sourceName}
                        <Avatar size="1" src={entry.sourceLogoUrl} alt={entry.sourceName.slice(0, 1)} />
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Text size="5" dangerouslySetInnerHTML={{ __html: entry.title }} />
                    <Text
                      variant="gray-soft"
                      size="2"
                      dangerouslySetInnerHTML={{ __html: entry.summarySnippet }}
                      className="group-expanded/accordion-item:opacity-40 mask-b-from-80% mask-intersect leading-6 motion-safe:transition-opacity"
                    />
                  </div>
                </div>
              </Accordion.ItemHeader>
              <Accordion.ItemPanel>
                <div className="flex flex-col gap-4 px-8">
                  <Text format="balance" variant="gray-soft" dangerouslySetInnerHTML={{ __html: entry.summary }} className="leading-6" />
                  <Link font="serif" variant="gray-soft" href={entry.url}>
                    {entry.urlLabel}
                  </Link>
                </div>
              </Accordion.ItemPanel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </>
  );
}
