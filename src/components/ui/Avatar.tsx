import { cn, initials } from '../../lib/utils';

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
};

const PALETTE = [
  'bg-indigo-500',
  'bg-rose-500',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-zinc-800',
];

/** A API não guarda cor de avatar: derivamos uma cor estável a partir do id do usuário. */
function colorFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name?: string | null;
  seed?: string | null;
  title?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, seed, title, size = 'sm', className }: AvatarProps) {
  if (!name) return null;
  return (
    <span
      title={title ? `${name} · ${title}` : name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white',
        colorFor(seed ?? name),
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
