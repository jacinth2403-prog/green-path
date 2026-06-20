import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-leaf-400"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Carbon Compass — Understand & Reduce Your Footprint" },
      { name: "description", content: "Measure your monthly carbon footprint and get personalized actions to live more sustainably." },
      { property: "og:title", content: "Carbon Compass" },
      { property: "og:description", content: "Understand your impact. Track your progress. Reduce your footprint." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-leaf-600">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-300 text-white">🧭</span>
          <span className="text-base">Carbon Compass</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-2 text-foreground/80 hover:bg-leaf-100/60 hover:text-leaf-600 [&.active]:bg-leaf-100 [&.active]:text-leaf-600" activeOptions={{ exact: true }}>Dashboard</Link>
          <Link to="/progress" className="rounded-md px-3 py-2 text-foreground/80 hover:bg-leaf-100/60 hover:text-leaf-600 [&.active]:bg-leaf-100 [&.active]:text-leaf-600">Progress</Link>
          <Link to="/about" className="rounded-md px-3 py-2 text-foreground/80 hover:bg-leaf-100/60 hover:text-leaf-600 [&.active]:bg-leaf-100 [&.active]:text-leaf-600">About</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-leaf-600 text-white/85">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-3">
        <div>
          <div className="font-display text-lg font-semibold text-white">Carbon Compass</div>
          <p className="mt-2 text-sm text-white/70">Understand your impact. Track your progress. Reduce your footprint.</p>
        </div>
        <div className="text-sm">
          <div className="font-medium text-white">Explore</div>
          <ul className="mt-2 space-y-1.5 text-white/75">
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/progress">Progress</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </div>
        <div className="text-sm text-white/70">
          <div className="font-medium text-white">Disclaimer</div>
          <p className="mt-2">Results are estimates intended to support awareness and sustainable decision-making.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/55">© {new Date().getFullYear()} Carbon Compass</div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1"><Outlet /></main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
