import { cn, colorFromString, getInitials } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}

/** Circular avatar: photo when available, otherwise coloured initials. */
export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const initials = getInitials(name).toUpperCase();
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-background",
        className
      )}
      style={{
        width: size,
        height: size,
        background: src ? undefined : colorFromString(name ?? "?"),
        fontSize: size * 0.4,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? "avatar"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
