import { getComponentVariants } from '#/libs/variants';
import { ChevronsUpDownIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete as AriaAutocomplete } from 'react-aria-components/Autocomplete';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as AriaSelect from 'react-aria-components/Select';
import { Text as AriaText } from 'react-aria-components/Text';
import * as AriaVirtualizer from 'react-aria-components/Virtualizer';
import { cn, tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import Icon from './icon';
import { Surface } from './surface';
import { Text } from './typography';

export type SelectRootProps = React.ComponentProps<typeof AriaSelect.Select>;
export type SelectTriggerProps = Omit<React.ComponentProps<typeof AriaSelect.Button>, 'className'> &
  SelectTriggerVariants & {
    className?: ClassValue;
    valueProps?: React.ComponentProps<typeof AriaSelect.SelectValue>;
    iconProps?: React.ComponentProps<typeof Icon>;
  };
export type SelectPopoverProps = Omit<React.ComponentProps<typeof Surface<typeof AriaSelect.Popover>>, 'as'>;
export type SelectContentProps<T extends object> =
  | (Omit<SelectPopoverProps, 'children'> & {
      filterProps: Omit<React.ComponentProps<typeof AriaAutocomplete<T>>, 'children'>;
      children?: React.ComponentProps<typeof AriaAutocomplete<T>>['children'];
    })
  | (SelectPopoverProps & { filterProps?: undefined });
export type SelectItemsProps<T extends object> = React.ComponentProps<typeof AriaSelect.ListBox<T>> & {
  itemsVirtualized?: React.ComponentProps<typeof AriaSelect.ListBox<T>>['items'];
  virtualizerProps?: Omit<
    React.ComponentProps<typeof AriaVirtualizer.Virtualizer<AriaVirtualizer.ListLayoutOptions>>,
    'children' | 'layout'
  >;
};
export type SelectItemProps<T extends object> = Omit<React.ComponentProps<typeof AriaSelect.ListBoxItem<T>>, 'className'> &
  SelectItemVariants & { className?: ClassValue };
export type SelectItemNotFoundProps = Omit<React.ComponentProps<typeof Text<typeof AriaText>>, 'as'>;

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>;
export type SelectItemVariants = VariantProps<typeof selectItemVariants>;

export const SELECT_LAYOUT_OPTIONS: AriaVirtualizer.ListLayoutOptions = { rowHeight: 40, padding: 4 };

export const selectTriggerVariants = tv({
  extend: getComponentVariants({ hover: true }).variants,
  slots: {
    base: [
      'flex items-center justify-between gap-2 px-4 select-none',
      'focus:outline-none focus-visible:ring motion-safe:transition-colors',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    value: 'truncate placeholder-shown:text-current/50',
  },
  defaultVariants: { size: '2' },
  variants: {
    rounded: { true: { base: 'rounded' } },
    size: { '1': 'h-8 text-sm', '2': 'h-10 text-base', '3': 'h-12 text-lg', '4': 'h-14 text-xl', '5': 'h-16 text-2xl' },
  },
});

export const selectItemComponentVariants = getComponentVariants({ focus: true });
export const selectItemVariants = tv({
  extend: selectItemComponentVariants.variants,
  slots: {
    base: 'selected:font-semibold relative flex items-center px-4 outline-none motion-safe:transition-colors',
    marker: 'absolute inset-y-0 left-0.5 h-full w-1 bg-current/70',
    text: 'truncate',
  },
  defaultVariants: { variant: 'gray-ghost', size: '2' },
  variants: {
    size: {
      '1': { base: 'h-8 text-sm' },
      '2': { base: 'h-10 text-base' },
      '3': { base: 'h-12 text-lg' },
      '4': { base: 'h-14 text-xl' },
      '5': { base: 'h-16 text-2xl' },
    },
  },
  compoundVariants: [
    { variant: selectItemComponentVariants.keys.gray, className: { base: 'selected:text-gray-12' } },
    { variant: selectItemComponentVariants.keys.grayAccent, className: { base: 'selected:text-accent-11' } },
    { variant: selectItemComponentVariants.keys.grayWarn, className: { base: 'selected:text-warn-11' } },
    { variant: selectItemComponentVariants.keys.grayDanger, className: { base: 'selected:text-danger-11' } },
    { variant: selectItemComponentVariants.keys.accent, className: { base: 'selected:text-accent-11' } },
    { variant: selectItemComponentVariants.keys.warn, className: { base: 'selected:text-warn-11' } },
    { variant: selectItemComponentVariants.keys.danger, className: { base: 'selected:text-danger-11' } },
  ],
});

export const Root = AriaSelect.Select;

export function Trigger({ className, elevation, variant, rounded, size, valueProps, iconProps, ...props }: SelectTriggerProps) {
  const slots = selectTriggerVariants({ elevation, variant, rounded, size });
  return (
    <AriaSelect.Button className={slots.base({ className })} {...props}>
      <AriaSelect.SelectValue className={slots.value()} {...valueProps} />
      <Icon size="1" variant="gray-soft" source={<ChevronsUpDownIcon />} {...iconProps} />
    </AriaSelect.Button>
  );
}

export function Popover({ className, ...props }: SelectPopoverProps) {
  return (
    <Surface
      as={AriaSelect.Popover}
      opaque
      variant="gray-surface-outline"
      className={cn(
        'w-(--trigger-width) outline-none select-none',
        'exiting:duration-0 entering:opacity-0 origin-(--trigger-anchor-point) motion-safe:transition-all',
        'placement-bottom:entering:-translate-y-1 placement-top:entering:translate-y-1',
        'placement-left:entering:translate-x-1 placement-right:entering:-translate-x-1',
        className,
      )}
      {...props}
    />
  );
}

export function Content<T extends object>({ children, filterProps, ...props }: SelectContentProps<T>) {
  if (!filterProps) return <Popover {...props}>{children}</Popover>;
  return (
    <Popover {...props}>
      <AriaAutocomplete<T> {...filterProps}>{children}</AriaAutocomplete>
    </Popover>
  );
}

export function ListBox<T extends object>({ className, ...props }: SelectItemsProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setIsOverflowing(entry.target.scrollHeight > entry.target.clientHeight));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <AriaSelect.ListBox<T>
      ref={ref}
      renderEmptyState={() => <ItemNotFound />}
      className={cn('scrollbar max-h-96 overflow-auto outline-none not-data-virtual:p-1', isOverflowing && 'scroll-mask', className)}
      {...props}
    />
  );
}

export function Items<T extends object>({ itemsVirtualized, virtualizerProps, ...props }: SelectItemsProps<T>) {
  if (!itemsVirtualized) return <ListBox<T> {...props} />;
  return (
    <AriaVirtualizer.Virtualizer<AriaVirtualizer.ListLayoutOptions>
      layout={AriaVirtualizer.ListLayout}
      layoutOptions={SELECT_LAYOUT_OPTIONS}
      {...virtualizerProps}
    >
      <ListBox<T> data-virtual items={itemsVirtualized} {...props} />
    </AriaVirtualizer.Virtualizer>
  );
}

export function Item<T extends object>({ children, className, elevation, variant, size, ...props }: SelectItemProps<T>) {
  const textValue = useMemo(() => (typeof children === 'string' ? children.trim() : ''), [children]);
  const slots = selectItemVariants({ elevation, variant, size });

  return (
    <AriaSelect.ListBoxItem<T> textValue={textValue} className={slots.base({ className })} {...props}>
      {composeRenderProps(children, (children, renderProps) => (
        <>
          {renderProps.isSelected && <div className={slots.marker()} />}
          <span className={slots.text()}>{children}</span>
        </>
      ))}
    </AriaSelect.ListBoxItem>
  );
}

export function ItemNotFound({ children, className, ...props }: SelectItemNotFoundProps) {
  return (
    <Text as={AriaText} size="2" variant="gray-soft" className={cn('flex items-center justify-center py-8', className)} {...props}>
      {children ?? 'No results found'}
    </Text>
  );
}
