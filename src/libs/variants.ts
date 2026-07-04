import { tv, type VariantProps } from 'tailwind-variants';

export type ComponentVariants = VariantProps<ReturnType<typeof getComponentVariants>['variants']>;
export type ComponentVariantsProps = { slot?: string; hover?: boolean };

// prettier-ignore
export const getComponentVariants = ({ slot = 'base', hover }: ComponentVariantsProps = {}) => {
  const variants = tv({
    variants: {
      elevation: { '1': { [slot]: 'elevation-1' }, '2': { [slot]: 'elevation-2' }, '3': { [slot]: 'elevation-3' } },
      variant: {
        'gray-surface': { [slot]: ['bg-gray-1 text-gray-11 ring-accent-8', hover && 'hover:bg-gray-2'] },
        'gray-solid': { [slot]: ['bg-gray-9 text-gray-contrast ring-accent-8', hover && 'hover:bg-gray-10'] },
        'gray-soft': { [slot]: ['bg-gray-3 text-gray-11  ring-accent-8', hover && 'hover:bg-gray-4'] },
        'gray-ghost': { [slot]: ['text-gray-11 ring-accent-8', hover && 'hover:text-gray-12'] },
        'gray-surface-outline': { [slot]: ['bg-gray-1 border-gray-7 text-gray-11 border ring-accent-8', hover && 'hover:bg-gray-2'] },
        'gray-soft-outline': { [slot]: ['bg-gray-3 border-gray-7 text-gray-11 border ring-accent-8', hover && 'hover:bg-gray-4'] },
        'gray-ghost-outline': { [slot]: ['border-gray-7 text-gray-11 border ring-accent-8', hover && 'hover:border-gray-8'] },
        'gray-accent-surface': { [slot]: ['bg-gray-1 text-accent-11 ring-accent-8', hover && 'hover:bg-gray-2'] },
        'gray-accent-soft': { [slot]: ['bg-gray-3 text-accent-11 ring-accent-8', hover && 'hover:bg-gray-4'] },
        'gray-accent-ghost': { [slot]: ['text-accent-11 ring-accent-8', hover && 'hover:text-accent-12'] },
        'gray-accent-surface-outline': { [slot]: ['bg-gray-1 border-gray-7 text-accent-11 border ring-accent-8', hover && 'hover:bg-gray-2'] },
        'gray-accent-soft-outline': { [slot]: ['bg-gray-3 border-gray-7 text-accent-11 border ring-accent-8', hover && 'hover:bg-gray-4'] },
        'gray-accent-ghost-outline': { [slot]: ['border-gray-7 text-accent-11 border ring-accent-8', hover && 'hover:border-accent-8'] },
        'gray-warn-surface': { [slot]: ['bg-gray-1 text-warn-11 ring-warn-8', hover && 'hover:bg-gray-2'] },
        'gray-warn-soft': { [slot]: ['bg-gray-3 text-warn-11 ring-warn-8', hover && 'hover:bg-gray-4'] },
        'gray-warn-ghost': { [slot]: ['text-warn-11 ring-warn-8', hover && 'hover:text-warn-12'] },
        'gray-warn-surface-outline': { [slot]: ['bg-gray-1 border-gray-7 text-warn-11 border ring-warn-8', hover && 'hover:bg-gray-2'] },
        'gray-warn-soft-outline': { [slot]: ['bg-gray-3 border-gray-7 text-warn-11 border ring-warn-8', hover && 'hover:bg-gray-4'] },
        'gray-warn-ghost-outline': { [slot]: ['border-gray-7 text-warn-11 border ring-warn-8', hover && 'hover:border-gray-8'] },
        'gray-danger-surface': { [slot]: ['bg-gray-1 text-danger-11 ring-danger-8', hover && 'hover:bg-gray-2'] },
        'gray-danger-soft': { [slot]: ['bg-gray-3 text-danger-11 ring-danger-8', hover && 'hover:bg-gray-4'] },
        'gray-danger-ghost': { [slot]: ['text-danger-11 ring-danger-8', hover && 'hover:text-danger-12'] },
        'gray-danger-surface-outline': { [slot]: ['bg-gray-1 border-gray-7 text-danger-11 border ring-danger-8', hover && 'hover:bg-gray-2'] },
        'gray-danger-soft-outline': { [slot]: ['bg-gray-3 border-gray-7 text-danger-11 border ring-danger-8', hover && 'hover:bg-gray-4'] },
        'gray-danger-ghost-outline': { [slot]: ['border-gray-7 text-danger-11 border ring-danger-8', hover && 'hover:border-gray-8'] },
        'accent-surface': { [slot]: ['bg-accent-1 text-accent-11 ring-accent-8', hover && 'hover:bg-accent-2'] },
        'accent-solid': { [slot]: ['bg-accent-9 text-accent-contrast ring-accent-8', hover && 'hover:bg-accent-10'] },
        'accent-soft': { [slot]: ['bg-accent-3 text-accent-11 ring-accent-8', hover && 'hover:bg-accent-4'] },
        'accent-ghost': { [slot]: ['text-accent-11 ring-accent-8', hover && 'hover:text-accent-12'] },
        'accent-surface-outline': { [slot]: ['bg-accent-1 border-accent-7 text-accent-11 border ring-accent-8', hover && 'hover:bg-accent-2'] },
        'accent-soft-outline': { [slot]: ['bg-accent-3 border-accent-7 text-accent-11 border ring-accent-8', hover && 'hover:bg-accent-4'] },
        'accent-ghost-outline': { [slot]: ['border-accent-7 text-accent-11 border ring-accent-8', hover && 'hover:border-accent-8'] },
        'warn-surface': { [slot]: ['bg-warn-1 text-warn-11 ring-warn-8', hover && 'hover:bg-warn-2'] },
        'warn-solid': { [slot]: ['bg-warn-9 text-warn-contrast ring-warn-8', hover && 'hover:bg-warn-10'] },
        'warn-soft': { [slot]: ['bg-warn-3 text-warn-11 ring-warn-8', hover && 'hover:bg-warn-4'] },
        'warn-ghost': { [slot]: ['text-warn-11 ring-warn-8', hover && 'hover:text-warn-12'] },
        'warn-surface-outline': { [slot]: ['bg-warn-1 border-warn-7 text-warn-11 border ring-warn-8', hover && 'hover:bg-warn-2'] },
        'warn-soft-outline': { [slot]: ['bg-warn-3 border-warn-7 text-warn-11 border ring-warn-8', hover && 'hover:bg-warn-4'] },
        'warn-ghost-outline': { [slot]: ['border-warn-7 text-warn-11 border ring-warn-8', hover && 'hover:border-warn-8'] },
        'danger-surface': { [slot]: ['bg-danger-1 text-danger-11 ring-danger-8', hover && 'hover:bg-danger-2'] },
        'danger-solid': { [slot]: ['bg-danger-9 text-danger-contrast ring-danger-8', hover && 'hover:bg-danger-10'] },
        'danger-soft': { [slot]: ['bg-danger-3 text-danger-11 ring-danger-8', hover && 'hover:bg-danger-4'] },
        'danger-ghost': { [slot]: ['text-danger-11 ring-danger-8', hover && 'hover:text-danger-12'] },
        'danger-surface-outline': { [slot]: ['bg-danger-1 border-danger-7 text-danger-11 border ring-danger-8', hover && 'hover:bg-danger-2'] },
        'danger-soft-outline': { [slot]: ['bg-danger-3 border-danger-7 text-danger-11 border ring-danger-8', hover && 'hover:bg-danger-4'] },
        'danger-ghost-outline': { [slot]: ['border-danger-7 text-danger-11 border ring-danger-8', hover && 'hover:border-danger-8'] },
      },
    },
  });

  const keys = Object.keys(variants.variants.variant).reduce((acc, key) => {
    if (key.startsWith('gray-accent-')) (acc.grayAccent ??= [])?.push(key);
    else if (key.startsWith('gray-warn-')) (acc.grayWarn ??= [])?.push(key);
    else if (key.startsWith('gray-danger-')) (acc.grayDanger ??= [])?.push(key);
    else if (key.startsWith('gray-')) (acc.gray ??= [])?.push(key);
    else if (key.startsWith('accent-')) (acc.accent ??= [])?.push(key);
    else if (key.startsWith('warn-')) (acc.warn ??= [])?.push(key);
    else if (key.startsWith('danger-')) (acc.danger ??= [])?.push(key);
    return acc;
    // https://github.com/heroui-inc/tailwind-variants/issues/185
  }, {} as Record<'gray' | 'grayAccent' | 'grayWarn' | 'grayDanger' | 'accent' | 'warn' | 'danger', any>);

  return { keys, variants };
};
