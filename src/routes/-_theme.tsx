import Button from '#/components/button';
import { CircleHalfIcon } from '@phosphor-icons/react';
import { ScriptOnce } from '@tanstack/react-router';
import { createContext, use, useEffect, useState } from 'react';

export type ThemeProviderProps = { children: React.ReactNode };
export type ThemeTriggerProps = React.ComponentProps<typeof Button>;
export type Theme = 'dark' | 'light' | 'auto';

export const THEME_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
export function useTheme() {
  const context = use(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export function applyTheme(theme: Theme) {
  const apply = () => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    const resolved = theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  };

  if (!document.startViewTransition) apply();
  else document.startViewTransition(apply);
}

export function Provider(props: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('auto');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    setTheme(stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto');
    setMounted(true);
  }, []);

  useEffect(() => (mounted ? applyTheme(theme) : undefined), [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== 'auto') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('auto');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme, mounted]);

  return <ThemeContext value={{ theme, setTheme: (theme) => (localStorage.setItem('theme', theme), setTheme(theme)) }} {...props} />;
}

export function Script() {
  return <ScriptOnce children={THEME_SCRIPT} />;
}

export function Trigger(props: ThemeTriggerProps) {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <Button
        aria-label="Toggle theme"
        variant="gray-ghost-outline"
        size="2-icon"
        icon={{ source: <CircleHalfIcon /> }}
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        {...props}
      />
    </>
  );
}
