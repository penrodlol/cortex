import Surface from '#/components/surface';
import { createContext, use, useMemo, useState } from 'react';
import { cn, tv, type VariantProps } from 'tailwind-variants';

export type LayoutRootProps = React.ComponentProps<typeof Surface>;
export type LayoutRowProps = React.ComponentProps<typeof Surface> & LayoutRowVariants;
export type LayoutContentProps = React.ComponentProps<typeof Surface>;
export type LayoutSectionProps<T> = React.ComponentProps<typeof Surface> & {
  header: () => React.ReactNode;
  content: {
    entries: Array<T>;
    keyIdentifier: (entry: T) => React.Key;
    render: (entry: T, section: LayoutSectionContextValue) => React.ReactNode;
    noEntriesFound?: () => React.ReactNode;
  };
  footer: () => React.ReactNode;
};
export type LayoutSectionEntryProps<T> = {
  entry: LayoutSectionProps<T>['content']['entries'][number];
  render: LayoutSectionProps<T>['content']['render'];
};

export type LayoutSectionContextValue = { openEntry: string | undefined; setOpenEntry: (id: string | undefined) => void };
export const LayoutSectionContext = createContext<LayoutSectionContextValue | undefined>(undefined);
export function useLayoutSection() {
  const context = use(LayoutSectionContext);
  if (!context) throw new Error('useLayoutSection must be used within a LayoutSectionContext.Provider');
  return context;
}

export type LayoutRowVariants = VariantProps<typeof layoutRowVariants>;

export const layoutRowVariants = tv({
  base: [
    'border-gray-6 flex',
    '2xl:border-transparent',
    '2xl:[border-image:linear-gradient(to_right,transparent,var(--gray-6)_calc((100%-var(--container-7xl))/2),var(--gray-6)_calc((100%+var(--container-7xl))/2),transparent)_1]',
  ],
  defaultVariants: { border: 'bottom' },
  variants: { border: { top: 'border-t', bottom: 'border-b', none: 'border-none' } },
});

export function Root({ className, ...props }: LayoutRootProps) {
  return <Surface className={cn('mx-auto w-full max-w-[calc(var(--container-7xl)+var(--spacing)*80)]', className)} {...props} />;
}

export function Row({ className, border, ...props }: LayoutRowProps) {
  return <Surface className={layoutRowVariants({ border, className })} {...props} />;
}

export function Content({ className, ...props }: LayoutContentProps) {
  return <Surface className={cn('border-gray-6 mx-auto w-full max-w-7xl 2xl:border-x', className)} {...props} />;
}

export function Section<T>({ header, content, footer, className, ...props }: LayoutSectionProps<T>) {
  const [openEntry, setOpenEntry] = useState<string>();
  const layoutSectionContextValue = useMemo(() => ({ openEntry, setOpenEntry }), [openEntry]);
  const emptyEntries = useMemo(() => content.entries.length === 0, [content.entries.length]);
  const chunkedEntries = useMemo(
    () => Array.from({ length: Math.ceil((content.entries?.length ?? 0) / 2) }, (_, i) => content.entries?.slice(i * 2, i * 2 + 2)),
    [content.entries],
  );

  return (
    <LayoutSectionContext value={layoutSectionContextValue}>
      <Surface as="section" className={cn('flex flex-1 flex-col', className)} {...props}>
        <Row border="bottom">
          <Content className="grid lg:grid-cols-2">{header()}</Content>
        </Row>
        <Surface>
          {chunkedEntries.map((chunk) => (
            <Row key={content.keyIdentifier(chunk[0])}>
              <Content className="grid lg:grid-cols-2">
                {chunk.map((entry) => (
                  <SectionEntry key={content.keyIdentifier(entry)} entry={entry} render={content.render} />
                ))}
              </Content>
            </Row>
          ))}
        </Surface>
        {emptyEntries && content.noEntriesFound?.()}
        <Row border="none" className={cn(!emptyEntries && 'flex-1')}>
          <Content className="grid grid-cols-2">{footer()}</Content>
        </Row>
      </Surface>
    </LayoutSectionContext>
  );
}

function SectionEntry<T>({ entry, render }: LayoutSectionEntryProps<T>) {
  const section = useLayoutSection();
  return render(entry, section);
}
