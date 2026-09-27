"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type TopBarProps = {
  userEmail?: string;
  userName?: string;
  onToggleSidebar: () => void;
};

export function TopBar({ userEmail, userName, onToggleSidebar }: TopBarProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const initials = userName
    ? userName.slice(0, 2).toUpperCase()
    : userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : "U";

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="sb-navbar">
      <button
        type="button"
        className="sb-navbar-toggle"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M3 12h11" />
          <path d="M3 18h18" />
        </svg>
      </button>

      <div className="sb-navbar-spacer" />

      <div className="sb-user-wrap" ref={wrapRef}>
        <button
          type="button"
          className="sb-user"
          aria-controls="sb-user-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sb-avatar">{initials}</span>
          {userName && <span className="sb-user-name">{userName}</span>}
          <ChevronDownIcon className="sb-user-chevron" size={10} />
        </button>
        <div id="sb-user-menu" className="sb-menu" hidden={!menuOpen}>
          <a
            href="/profile"
            onClick={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              router.push("/profile");
            }}
          >
            <UserIcon size={14} />
            My Profile
          </a>
          <div className="sb-menu-divider" />
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              signOut();
            }}
          >
            <LogOutIcon size={14} />
            Log out
          </a>
        </div>
      </div>
    </div>
  );
}
