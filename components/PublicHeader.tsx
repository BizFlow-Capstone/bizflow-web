"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : "",
  );

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          if (id) {
            setActiveHash(`#${id}`);

            window.history.replaceState(null, "", `/#${id}`);
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      observer.disconnect();
    };
  }, []);

  const menuItems = useMemo(
    () => [
      { href: "/#home", label: "Trang Chủ" },
      { href: "/#features", label: "Tính Năng" },
      { href: "/#pricing", label: "Gói Trả Phí" },
      // { href: "/#why", label: "Về Chúng Tôi" },
      { href: "/#testimonials", label: "Đánh Giá" },
      { href: "/#contact", label: "Liên Hệ" },
    ],
    [],
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur shadow`}
    >
      <div className="mx-20 py-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/pictures/logo.png"
              alt="BizFlow Logo"
              width={80}
              height={80}
            />
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Primary"
          >
            {menuItems.map((item) => {
              const currentHash = activeHash || "#home";
              const isActive =
                pathname === "/" && item.href === `/${currentHash}`;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`relative font-medium text-slate-700 transition hover:text-[#1e3a5f] after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:bg-[#1e3a5f] after:transition-all after:duration-300 ${
                    isActive
                      ? "text-[#1e3a5f] after:w-full"
                      : "after:w-0 hover:after:w-full"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:text-[#1e3a5f]"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-md bg-[#1e7cdb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#145ba8]"
            >
              Đăng ký
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2 md:hidden"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
        </div>

        {open ? (
          <div className="md:hidden">
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid gap-1">
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1e3a5f]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-lg bg-[#1e7cdb] px-3 py-2 text-sm font-semibold text-white hover:bg-[#145ba8]"
                    onClick={() => setOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
