"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseIcon,
  BuildingIcon,
  ChevronRightIcon,
  FileTextIcon,
  MapPinIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import { isNavGroup, type NavGroup, type NavItem, type NavLink } from "@/lib/navigation";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "plus-circle": PlusCircleIcon,
  briefcase: BriefcaseIcon,
  "file-text": FileTextIcon,
  "map-pin": MapPinIcon,
  building: BuildingIcon,
  shield: ShieldCheckIcon,
  wrench: WrenchIcon,
};

type SidebarProps = {
  navItems: NavItem[];
  contracted: boolean;
  mobileOpen: boolean;
  animate: boolean;
  onCloseMobile: () => void;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupPanelId(label: string) {
  return `sb-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function NavIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return (
    <span className="sb-icon">
      <Icon className="sb-icon-svg" />
    </span>
  );
}

function NavLinkItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLink;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActivePath(pathname, item.href);
  return (
    <li className={`sb-item sb-level-1${active ? " is-active" : ""}`}>
      <Link
        href={item.href}
        className="sb-link"
        aria-label={item.label}
        onClick={onNavigate}
      >
        <NavIcon name={item.icon} />
        <span className="sb-label">{item.label}</span>
      </Link>
    </li>
  );
}

function NavGroupItem({
  item,
  pathname,
  contracted,
  open,
  flyout,
  onToggle,
  onFlyoutChange,
  onNavigate,
}: {
  item: NavGroup;
  pathname: string;
  contracted: boolean;
  open: boolean;
  flyout: boolean;
  onToggle: () => void;
  onFlyoutChange: (open: boolean) => void;
  onNavigate: () => void;
}) {
  const itemRef = useRef<HTMLLIElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const panelId = groupPanelId(item.label);
  const childActive = item.children.some((child) =>
    isActivePath(pathname, child.href)
  );

  function clearCloseTimer() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openFlyout() {
    if (!contracted) return;
    clearCloseTimer();
    onFlyoutChange(true);
  }

  function scheduleClose() {
    if (!contracted) return;
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      if (panelRef.current) panelRef.current.style.top = "";
      onFlyoutChange(false);
    }, 160);
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!flyout || !panelRef.current || !itemRef.current) return;
    const panel = panelRef.current;
    const itemTop = itemRef.current.getBoundingClientRect().top;
    const maxHeight = window.innerHeight - 16;
    // Keep the panel attached to the icon so the pointer can reach the links.
    // Tall menus scroll inside rather than jumping up and leaving a gap.
    panel.style.top = `${Math.max(8, itemTop)}px`;
    const inner = panel.querySelector(".sb-sub-inner") as HTMLElement | null;
    if (inner) {
      inner.style.maxHeight = `${Math.max(80, maxHeight - Math.max(8, itemTop) + 8)}px`;
    }
  }, [flyout]);

  return (
    <li
      ref={itemRef}
      className={`sb-item sb-level-1 has-sub${childActive ? " is-open-path" : ""}${flyout ? " is-flyout" : ""}`}
      onMouseEnter={openFlyout}
      onMouseLeave={scheduleClose}
      onFocusCapture={openFlyout}
      onBlurCapture={(event) => {
        if (!itemRef.current?.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        className="sb-link sb-toggle"
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={item.label}
        onClick={() => {
          if (contracted) return;
          onToggle();
        }}
      >
        <NavIcon name={item.icon} />
        <span className="sb-label">{item.label}</span>
        <ChevronRightIcon className="sb-chevron" />
      </button>
      <div
        id={panelId}
        ref={panelRef}
        className="sb-sub"
        hidden={!open && !flyout}
        onMouseEnter={openFlyout}
        onMouseLeave={scheduleClose}
      >
        <div className="sb-sub-inner">
          <div className="sb-flyout-title">{item.label}</div>
          <ul>
            {item.children.map((child) => {
              const active = isActivePath(pathname, child.href);
              return (
                <li
                  key={child.href}
                  className={`sb-item sb-level-2${active ? " is-active" : ""}`}
                >
                  <Link
                    href={child.href}
                    className="sb-link"
                    onClick={onNavigate}
                  >
                    <span className="sb-label">{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}

export function Sidebar({
  navItems,
  contracted,
  mobileOpen,
  animate,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [flyoutGroup, setFlyoutGroup] = useState<string | null>(null);

  useEffect(() => {
    const activeGroup = navItems.find(
      (item) =>
        isNavGroup(item) &&
        item.children.some((child) => isActivePath(pathname, child.href))
    );
    setOpenGroup(activeGroup && isNavGroup(activeGroup) ? activeGroup.label : null);
    setFlyoutGroup(null);
  }, [pathname, navItems]);

  const className = [
    "sb-sidebar",
    animate ? "sb-animate" : "",
    contracted ? "contracted" : "",
    mobileOpen ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={className} aria-label="Main navigation">
      <div className="sb-header">
        <Link href="/home">
          <img
            src="/brand/logo_white_sidebar.png"
            alt="SelfBrief"
            className="sb-logo"
          />
          <img
            src="/brand/logo_mark_sidebar.png"
            alt=""
            className="sb-logo sb-logo-contracted"
          />
        </Link>
        <button
          type="button"
          className="sb-close"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="sb-body">
        <ul className="sb-nav">
          {navItems.map((item) =>
            isNavGroup(item) ? (
              <NavGroupItem
                key={item.label}
                item={item}
                pathname={pathname}
                contracted={contracted}
                open={openGroup === item.label}
                flyout={flyoutGroup === item.label}
                onToggle={() =>
                  setOpenGroup((current) =>
                    current === item.label ? null : item.label
                  )
                }
                onFlyoutChange={(show) => {
                  if (!contracted) return;
                  setFlyoutGroup(show ? item.label : null);
                }}
                onNavigate={onCloseMobile}
              />
            ) : (
              <NavLinkItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onCloseMobile}
              />
            )
          )}
        </ul>
      </div>
    </nav>
  );
}
