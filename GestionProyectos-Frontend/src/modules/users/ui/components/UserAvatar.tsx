import { cn } from '../../../../shared/lib/cn.js';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return (first + last).toUpperCase();
}

export type UserAvatarSize = 'sm' | 'md' | 'lg';

const SIZES: Record<UserAvatarSize, string> = {
  sm: 'h-7 w-7 text-[10.5px]',
  md: 'h-8 w-8 text-[11.5px]',
  lg: 'h-14 w-14 text-[16px]'
};

export interface UserAvatarProps {
  user?: { name?: string | null } | null;
  size?: UserAvatarSize;
  className?: string;
}

export default function UserAvatar({
  user,
  size = 'md',
  className
}: UserAvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-bg-muted font-semibold text-fg-muted',
        SIZES[size],
        className
      )}
    >
      {initials(user?.name)}
    </span>
  );
}
