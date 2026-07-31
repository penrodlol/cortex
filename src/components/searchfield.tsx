import { getComponentVariants } from '#/libs/variants';
import { XIcon } from 'lucide-react';
import { Group as AriaGroup } from 'react-aria-components/Group';
import * as AriaSearchField from 'react-aria-components/SearchField';
import { tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import Button from './button';
import Icon from './icon';

export type SearchFieldRoot = Omit<React.ComponentProps<typeof AriaSearchField.SearchField>, 'className'> &
  SearchFieldVariants & {
    className?: ClassValue;
    groupProps?: Omit<React.ComponentProps<typeof AriaGroup>, 'className'> & { className?: ClassValue };
    inputProps?: Omit<React.ComponentProps<typeof AriaSearchField.Input>, 'className'> & { className?: ClassValue };
    iconProps?: React.ComponentProps<typeof Icon>;
    clearButtonProps?: React.ComponentProps<typeof Button>;
  };

export type SearchFieldVariants = Omit<VariantProps<typeof searchFieldVariants>, 'hasIcon'>;

export const searchFieldVariants = tv({
  extend: getComponentVariants().variants,
  slots: {
    base: 'group/searchfield w-full',
    group: 'relative flex size-full items-center overflow-hidden',
    input: [
      'size-full flex-1 pr-10 pl-4 outline-none [&::-webkit-search-cancel-button]:hidden',
      'placeholder:text-gray-11/70 motion-safe:transition-colors',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    icon: 'absolute top-1/2 right-10 -translate-y-1/2',
    clear: 'absolute top-1/2 right-1 -translate-y-1/2 group-empty/searchfield:invisible',
  },
  defaultVariants: { size: '2' },
  variants: {
    hasIcon: { true: { input: 'pr-16' } },
    size: {
      '1': { base: 'h-10 text-sm' },
      '2': { base: 'h-12 text-base' },
      '3': { base: 'h-14 text-lg' },
      '4': { base: 'h-16 text-xl' },
      '5': { base: 'h-18 text-2xl' },
    },
  },
});

export default function SearchField({
  className,
  elevation,
  variant,
  size,
  groupProps,
  inputProps,
  iconProps,
  clearButtonProps,
  ...props
}: SearchFieldRoot) {
  const slots = searchFieldVariants({ elevation, variant, hasIcon: !!iconProps, size });
  const { className: groupClassName, ...internalGroupProps } = groupProps ?? {};
  const { className: inputClassName, ...internalInputProps } = inputProps ?? {};
  const { className: iconClassName, ...internalIconProps } = iconProps ?? {};
  const { className: clearButtonClassName, ...internalClearButtonProps } = clearButtonProps ?? {};
  return (
    <AriaSearchField.SearchField className={slots.base({ className })} {...props}>
      <AriaGroup className={slots.group({ className: groupClassName })} {...internalGroupProps}>
        <AriaSearchField.Input className={slots.input({ className: inputClassName })} {...internalInputProps} />
        {iconProps && (
          <Icon
            variant="gray-soft"
            size="1"
            className={slots.icon({ className: iconClassName })}
            {...(internalIconProps as typeof iconProps)}
          />
        )}
        <Button
          size="2-icon"
          variant="gray-ghost"
          icon={{ source: <XIcon /> }}
          className={slots.clear({ className: clearButtonClassName })}
          {...internalClearButtonProps}
        />
      </AriaGroup>
    </AriaSearchField.SearchField>
  );
}
