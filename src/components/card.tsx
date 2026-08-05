import { cn } from 'tailwind-variants';
import Surface from './surface';

export type CardRootProps<T extends React.ElementType> = React.ComponentProps<typeof Surface<T>>;
export type CardHeaderProps = React.ComponentProps<'div'>;
export type CardContentProps = React.ComponentProps<'div'>;
export type CardFooterProps = React.ComponentProps<'div'>;

export const Root = <T extends React.ElementType = 'div'>({ className, ...props }: CardRootProps<T>) => {
  return <Surface className={cn('flex flex-col gap-2', className)} {...(props as CardRootProps<T>)} />;
};

export function Header({ className, ...props }: CardHeaderProps) {
  return <div className={cn('flex items-center gap-2', className)} {...props} />;
}

export function Content({ className, ...props }: CardContentProps) {
  return <div className={cn('flex flex-col gap-6 pb-2', className)} {...props} />;
}

export function Footer({ className, ...props }: CardFooterProps) {
  return <div className={cn('flex items-center gap-2', className)} {...props} />;
}
