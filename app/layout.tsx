import type { Metadata } from "next";
import "@fontsource/teko/700.css";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Liquidity Pair — LP / MET",
  description: "Liquidity Pair: one of the first Ember deploys, paired with Meteora's MET token on Solana.",
  icons: {
    icon: `${basePath}/brand/lp-pfp.webp`,
    shortcut: `${basePath}/brand/lp-pfp.webp`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="is-intro-locked" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const root = document.documentElement; if ("scrollRestoration" in history) history.scrollRestoration = "manual"; const reset = () => scrollTo(0, 0); const measure = () => { if (!document.querySelector(".site-shell")) return false; root.classList.remove("is-intro-locked"); root.style.setProperty("--intro-scrollbar-width", (innerWidth - root.clientWidth) + "px"); root.classList.add("is-intro-locked"); reset(); return true; }; const observer = new MutationObserver(() => { if (measure()) observer.disconnect(); }); observer.observe(root, { childList: true, subtree: true }); if (measure()) observer.disconnect(); reset(); addEventListener("pageshow", reset); })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
