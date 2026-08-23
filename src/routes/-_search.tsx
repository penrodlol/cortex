import { Avatar } from '#/components/avatar';
import Button from '#/components/button';
import * as Card from '#/components/card';
import * as Collapsible from '#/components/collapsible';
import * as Dialog from '#/components/dialog';
import Kbd from '#/components/kbd';
import Link from '#/components/link';
import SearchField from '#/components/searchfield';
import Spinner from '#/components/spinner';
import Surface from '#/components/surface';
import { DateTime, Text } from '#/components/typography';
import { getFeedByQueryQueryOptions, type GetFeedByQueryResponse } from '#/server/fetch/src/feed';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useRef, useState } from 'react';
import { cn } from 'tailwind-variants';

export type SearchContentEntryProps = {
  entry: GetFeedByQueryResponse['entries'][number];
  open: boolean;
  onOpenChange: (url: GetFeedByQueryResponse['entries'][number]['url'], open: boolean) => void;
};

export default function Search() {
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useHotkey('Mod+K', () => setIsOpen((open) => !open), { enabled: !isOpen });

  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button animate={false} variant="gray-ghost-outline" size="1" className="not-lg:w-full" icon={{ source: <MagnifyingGlassIcon /> }}>
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
          ref={dialogContentRef}
          variant="gray-surface-outline-gradient"
          className="relative flex flex-col overflow-hidden not-lg:h-full not-lg:border-x-0 not-lg:border-t-0 not-lg:border-b-0"
        >
          <SearchContent onSubmit={() => dialogContentRef?.current?.focus()} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchContent({ onSubmit }: Pick<React.ComponentProps<typeof SearchField>, 'onSubmit'>) {
  const [debouncedQuery, queryDebouncer] = useDebouncedValue('', { wait: 200 });
  const { data, isFetching } = useQuery(getFeedByQueryQueryOptions({ query: debouncedQuery }));
  const [openFeedItem, setOpenFeedItem] = useState<NonNullable<typeof data>['entries'][number]['url']>();

  const handleOpenFeedItemChange = useCallback(
    (url: NonNullable<typeof data>['entries'][number]['url'], open: boolean) => setOpenFeedItem(open ? url : undefined),
    [],
  );

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
        onSubmit={onSubmit}
        className="h-20 shrink-0"
      />
      {data?.entries.length === 0 && debouncedQuery.length > 0 && !isFetching && (
        <Surface className="flex h-full flex-col items-center justify-center lg:pb-12">
          <Text font="serif" size="6" weight="6">
            No Results Found
          </Text>
          <Text variant="gray-soft" size="2">
            Try searching for another keyword or phrase
          </Text>
        </Surface>
      )}
      {debouncedQuery.length > 0 && (
        <Surface
          className={cn(
            'scrollbar scroll-mask scrollbar-gutter-both overflow-auto',
            '**:[mark]:text-gray-12 **:[mark]:bg-transparent **:[mark]:px-1 **:[mark]:font-bold',
            '**:[mark]:decoration-accent-9 **:[mark]:underline **:[mark]:underline-offset-4',
          )}
        >
          {data?.entries.map((entry) => (
            <SearchContentEntry key={entry.url} entry={entry} open={openFeedItem === entry.url} onOpenChange={handleOpenFeedItemChange} />
          ))}
        </Surface>
      )}
    </>
  );
}

const SearchContentEntry = memo(({ entry, open, onOpenChange }: SearchContentEntryProps) => (
  <Collapsible.Root
    key={entry.url}
    open={open}
    onOpenChange={(open) => onOpenChange(entry.url, open)}
    className="border-gray-6 border-b px-8 py-10 first:pt-0 last:border-b-0 [&_a]:relative [&_a]:z-20"
  >
    <Collapsible.Trigger overlay aria-label={`Toggle ${entry.title}`} className="hover:bg-transparent" />
    <Card.Root>
      <Card.Header>
        <Text font="serif" variant="gray-soft" size="1">
          {entry.type}
        </Text>
        <Text variant="gray-soft" size="1">
          //
        </Text>
        <DateTime value={entry.pubDate} font="serif" variant="gray-soft" size="1" />
        <Link font="serif" variant="gray-soft" size="1" href={entry.sourceUrl} className="ml-auto flex items-center gap-2">
          {entry.sourceName}
          <Avatar size="1" src={entry.sourceLogoUrl} alt={entry.sourceName.slice(0, 1)} />
        </Link>
      </Card.Header>
      <Card.Content>
        <Text font="serif" format="balance" size="5" dangerouslySetInnerHTML={{ __html: entry.title.toUpperCase() }} />
        <Collapsible.Content faded className="data-collapsed:h-20">
          <Text format="balance" variant="gray-soft" size="2" dangerouslySetInnerHTML={{ __html: entry.summary }} className="leading-6" />
        </Collapsible.Content>
      </Card.Content>
      <Card.Footer>
        <Link font="serif" variant="gray-soft" href={entry.url}>
          {entry.urlLabel}
        </Link>
      </Card.Footer>
    </Card.Root>
  </Collapsible.Root>
));
