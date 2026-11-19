import type { ReactNode, SVGProps } from "react";

/**
 * Inline SVG icon set for Typing Arena AI (stage 1).
 * No external icon packages or CDNs. All icons use `currentColor`
 * and are decorative (aria-hidden) unless a `title` is passed.
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number | string;
  title?: string;
};

function BaseIcon({
  size = 20,
  title,
  className,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  const labelled = Boolean(title);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `icon ${className}` : "icon"}
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </BaseIcon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </BaseIcon>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </BaseIcon>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </BaseIcon>
  );
}

export function IconKeyboard(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <path d="M6.5 10h1" />
      <path d="M10 10h1" />
      <path d="M13.5 10h1" />
      <path d="M17 10h.5" />
      <path d="M8 14h8" />
    </BaseIcon>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </BaseIcon>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </BaseIcon>
  );
}

export function IconBars(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20h16" />
      <path d="M6.5 16v-5" />
      <path d="M10.5 16V6" />
      <path d="M14.5 16v-3" />
      <path d="M18.5 16V9" />
    </BaseIcon>
  );
}

export function IconChat(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </BaseIcon>
  );
}

export function IconRepeat(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M17 3l3 3-3 3" />
      <path d="M4 11V10a4 4 0 0 1 4-4h12" />
      <path d="M7 21l-3-3 3-3" />
      <path d="M20 13v1a4 4 0 0 1-4 4H4" />
    </BaseIcon>
  );
}

export function IconSpark(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" />
      <path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </BaseIcon>
  );
}

export function IconShield(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </BaseIcon>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.8 14.3A5 5 0 0 1 21 19.5" />
    </BaseIcon>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </BaseIcon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </BaseIcon>
  );
}

export function IconClock(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </BaseIcon>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </BaseIcon>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </BaseIcon>
  );
}

export function IconBook(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.5 5h6a3.5 3.5 0 0 1 3.5 3.5V20a2.5 2.5 0 0 0-2.5-2.5h-7z" />
      <path d="M21.5 5h-6A3.5 3.5 0 0 0 12 8.5V20a2.5 2.5 0 0 1 2.5-2.5h7z" />
    </BaseIcon>
  );
}

export function IconRoute(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
    </BaseIcon>
  );
}
