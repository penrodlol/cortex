import { PauseIcon, PlayIcon } from '@phosphor-icons/react';
import * as Primitive from 'media-chrome/react/media-store';
import { createContext, memo, use, useEffect, useId, useRef, useState } from 'react';
import * as AriaSlider from 'react-aria-components/Slider';
import { cn, tv, type ClassValue, type VariantProps } from 'tailwind-variants';
import Button from './button';
import Surface from './surface';
import { Text } from './typography';

export type AudioRootProps = React.ComponentProps<typeof Surface> & {
  src: React.ComponentProps<'audio'>['src'];
  audioProps?: Omit<React.ComponentProps<'audio'>, 'src'>;
};
export type AudioTriggerProps = React.ComponentProps<typeof Button>;
export type AudioLabelProps = Omit<React.ComponentProps<typeof Text<'span'>>, 'as' | 'id'>;
export type AudioTimeProps = Omit<React.ComponentProps<typeof Text<'span'>>, 'as'> & {
  currentTimeProps?: Omit<React.ComponentProps<typeof Text<'time'>>, 'as'>;
  durationProps?: Omit<React.ComponentProps<typeof Text<'time'>>, 'as'>;
  delimiter?: React.ReactNode;
};
export type AudioWaveformSliderClipPathProps = { id: string; peaks: Array<number>; barCount: number };
export type AudioWaveformSliderProps = Omit<React.ComponentProps<typeof AriaSlider.Slider>, 'className'> &
  AudioWaveformSliderVariants & {
    peaks: Array<number>;
    className?: ClassValue;
    trackProps?: Omit<React.ComponentProps<typeof AriaSlider.SliderTrack>, 'className'> & { className?: ClassValue };
    thumbProps?: Omit<React.ComponentProps<typeof AriaSlider.SliderThumb>, 'className'> & { className?: ClassValue };
    waveformProps?: Omit<React.ComponentProps<'div'>, 'className'> & { className?: ClassValue };
    waveformFillProps?: Omit<React.ComponentProps<'div'>, 'className'> & { className?: ClassValue };
  };

export type AudioWaveformSliderVariants = VariantProps<typeof audioWaveformSliderVariants>;

export const audioWaveformSliderVariants = tv({
  slots: {
    base: 'relative h-full',
    track: 'relative size-full [&_svg]:absolute [&_svg]:size-0',
    thumb: 'focus-visible:ring-accent-8 top-1/2 h-full w-2 focus-visible:ring',
    waveform: 'bg-gray-5 pointer-events-none absolute inset-x-0 inset-y-1',
    waveformFill: 'bg-accent-9/20 absolute inset-0 origin-left will-change-transform rtl:origin-right',
  },
});

export const AudioLabelContext = createContext<string | undefined>(undefined);
export function useAudioLabelId() {
  const id = use(AudioLabelContext);
  if (!id) throw new Error('AudioLabelContext is not provided');
  return id;
}

export function Root(props: AudioRootProps) {
  return (
    <Primitive.MediaProvider>
      <RootContent {...props} />
    </Primitive.MediaProvider>
  );
}

function RootContent({ children, className, src, audioProps, ...props }: AudioRootProps) {
  const audioRef = Primitive.useMediaRef();
  const audioLabelId = useId();
  return (
    <Surface role="group" aria-labelledby={audioLabelId} className={cn('relative flex items-center', className)} {...props}>
      <audio preload="metadata" ref={audioRef} src={src} {...audioProps} />
      <AudioLabelContext value={audioLabelId}>{children}</AudioLabelContext>
    </Surface>
  );
}

export function Label({ className, ...props }: AudioLabelProps) {
  const id = useAudioLabelId();
  return <Text as="span" id={id} className={cn('inline-flex items-center', className)} {...props} />;
}

export function Trigger({ onPress, ...props }: AudioTriggerProps) {
  const dispatch = Primitive.useMediaDispatch();
  const paused = Primitive.useMediaSelector((state) => state.mediaPaused ?? true);
  return (
    <Button
      aria-label={paused ? 'Play' : 'Pause'}
      icon={{ source: paused ? <PlayIcon weight="fill" /> : <PauseIcon weight="fill" /> }}
      onPress={(event) => (
        onPress?.(event),
        dispatch({ type: paused ? Primitive.MediaActionTypes.MEDIA_PLAY_REQUEST : Primitive.MediaActionTypes.MEDIA_PAUSE_REQUEST })
      )}
      {...props}
    />
  );
}

export function Time({ currentTimeProps, durationProps, delimiter, ...props }: AudioTimeProps) {
  const format = (value?: number) => (value && Number.isFinite(value) ? Math.floor(value) : 0);
  const currentTime = Primitive.useMediaSelector((state) => format(state.mediaCurrentTime));
  const duration = Primitive.useMediaSelector((state) => format(state.mediaDuration));
  return (
    <Text as="span" font="mono" {...props}>
      <Text as="time" size="inherit" weight="inherit" dateTime={`PT${currentTime}S`} {...currentTimeProps}>
        {Primitive.timeUtils.formatTime(currentTime, duration)}
      </Text>
      {` ${delimiter ?? '/'} `}
      <Text as="time" size="inherit" weight="inherit" dateTime={`PT${duration}S`} {...durationProps}>
        {Primitive.timeUtils.formatTime(duration)}
      </Text>
    </Text>
  );
}

export const WaveformSliderClipPath = memo(({ id, peaks, barCount }: AudioWaveformSliderClipPathProps) => (
  <svg aria-hidden="true">
    <clipPath id={id} clipPathUnits="objectBoundingBox">
      {Array.from({ length: barCount }, (_, i) => {
        const start = Math.floor((i / barCount) * peaks.length);
        const end = Math.max(start + 1, Math.floor(((i + 1) / barCount) * peaks.length));
        const slice = peaks.slice(start, end);
        const peak = slice.length ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0;
        const height = Math.max(0.06, peak);
        return <rect key={i} x={(i + 1 / 6) / barCount} y={(1 - height) / 2} width={2 / 3 / barCount} height={height} />;
      })}
    </clipPath>
  </svg>
));

export function WaveformSlider({
  peaks,
  className,
  trackProps,
  thumbProps,
  waveformProps,
  waveformFillProps,
  onChange,
  onChangeEnd,
  ...props
}: AudioWaveformSliderProps) {
  const slots = audioWaveformSliderVariants();
  const waveformClipPathId = useId();
  const waveformRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const dispatch = Primitive.useMediaDispatch();
  const currentTime = Primitive.useMediaSelector((state) => state.mediaCurrentTime ?? 0);
  const duration = Primitive.useMediaSelector((state) => state.mediaDuration);

  const [waveformBarCount, setWaveformBarCount] = useState(0);
  const [scrubValue, setScrubValue] = useState<number | null>(null);

  const { className: trackClassName, ...internalTrackProps } = trackProps ?? {};
  const { className: thumbClassName, ...internalThumbProps } = thumbProps ?? {};
  const { className: waveformClassName, style: waveformStyle, ...internalWaveformProps } = waveformProps ?? {};
  const { className: waveformFillClassName, style: waveformFillStyle, ...internalWaveformFillProps } = waveformFillProps ?? {};

  const hasDuration = !!duration && Number.isFinite(duration);
  const progress = hasDuration ? Math.min(1, Math.max(0, (scrubValue ?? currentTime) / duration)) : 0;

  useEffect(() => void (!isScrubbingRef.current && setScrubValue(null)), [currentTime]);
  useEffect(() => {
    const element = waveformRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWaveformBarCount(Math.floor(entry.contentRect.width / 3)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <AriaSlider.Slider
      aria-label="Seek"
      minValue={0}
      maxValue={hasDuration ? duration : 1}
      step={0.1}
      isDisabled={!hasDuration}
      value={scrubValue ?? currentTime}
      onChange={(value) => (onChange?.(value), (isScrubbingRef.current = true), setScrubValue(Array.isArray(value) ? value[0] : value))}
      onChangeEnd={(value) => (
        (isScrubbingRef.current = false),
        onChangeEnd?.(value),
        dispatch({ type: Primitive.MediaActionTypes.MEDIA_SEEK_REQUEST, detail: Array.isArray(value) ? value[0] : value })
      )}
      className={slots.base({ className })}
      {...props}
    >
      <AriaSlider.SliderTrack className={slots.track({ className: trackClassName })} {...internalTrackProps}>
        <AriaSlider.SliderThumb
          aria-valuetext={`${Primitive.timeUtils.formatAsTimePhrase(Math.floor(scrubValue ?? currentTime))} of ${Primitive.timeUtils.formatAsTimePhrase(Math.floor(hasDuration ? duration : 0))}`}
          className={slots.thumb({ className: thumbClassName })}
          {...internalThumbProps}
        />
        <WaveformSliderClipPath id={waveformClipPathId} peaks={peaks} barCount={waveformBarCount} />
        <div
          ref={waveformRef}
          style={{ clipPath: `url(#${waveformClipPathId})`, ...waveformStyle }}
          className={slots.waveform({ className: waveformClassName })}
          {...internalWaveformProps}
        >
          <div
            style={{ transform: `scaleX(${progress})`, ...waveformFillStyle }}
            className={slots.waveformFill({ className: waveformFillClassName })}
            {...internalWaveformFillProps}
          />
        </div>
      </AriaSlider.SliderTrack>
    </AriaSlider.Slider>
  );
}
