import React, { useState, useEffect, useCallback } from "react";
import { GlobalSearchBar } from "./components/GlobalSearchBar";
import { PoliticianProfile } from "./components/PoliticianProfile";
import { DisclaimerModal } from "./components/DisclaimerModal";
import { DataBadge } from "./components/DataBadge";
import { ComingSoonSection } from "./components/ComingSoonSection";
import { RequestPolitician } from "./components/RequestPolitician";
import { searchPoliticians } from "./services/api";
import type { PoliticianSummary, DataMeta } from "./types";

// ─── Slug helpers ───────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Route parsing ──────────────────────────────────────────────────────────

type Route =
  | { page: "home" }
  | { page: "profile"; slug: string };

function parseRoute(): Route {
  const path = window.location.pathname;
  const match = path.match(/^\/politician\/([^?/]+)/);
  if (match) {
    return { page: "profile", slug: decodeURIComponent(match[1]) };
  }
  return { page: "home" };
}

// ─── Navigation helpers ─────────────────────────────────────────────────────

function navigateTo(route: Route) {
  const url = route.page === "home" ? "/" : `/politician/${route.slug}`;
  window.history.pushState(null, "", url);
}

// ─── Logo component ─────────────────────────────────────────────────────────

const Logo: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-3 mx-auto group cursor-pointer"
  >
    <img
      src="/project-vigil.png"
      alt="Project Vigil"
      className="h-10 w-auto"
    />
    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary group-hover:text-accent transition-colors">
      PROJECT <span className="text-accent">VIGIL</span>
    </h1>
  </button>
);

// ─── App ────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(parseRoute);
  const [showDisclaimer, setShowDisclaimer] = useState(
    !sessionStorage.getItem("disclaimerAcknowledged"),
  );

  // Listen for browser back/forward
  useEffect(() => {
    const onPopState = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goHome = useCallback(() => {
    navigateTo({ page: "home" });
    setRoute({ page: "home" });
  }, []);

  const goToProfile = useCallback((p: PoliticianSummary) => {
    const slug = toSlug(p.name);
    const profileRoute: Route = { page: "profile", slug };
    navigateTo(profileRoute);
    setRoute(profileRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (showDisclaimer) {
    return (
      <DisclaimerModal
        onClose={() => {
          sessionStorage.setItem("disclaimerAcknowledged", "true");
          setShowDisclaimer(false);
        }}
      />
    );
  }

  return (
    <div className="bg-surface-primary min-h-screen text-text-primary font-sans">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        {route.page === "home" ? (
          <HomePage onSelectPolitician={goToProfile} onLogoClick={goHome} />
        ) : (
          <ProfilePage slug={route.slug} onNavigateHome={goHome} />
        )}

        <footer className="text-center text-text-tertiary text-xs mt-16 py-6 border-t border-surface-border">
          <p>Data sourced from public election affidavits via myneta.info</p>
          <p className="mt-1 text-text-tertiary/60">
            Independent transparency tool. Not affiliated with any government body.
          </p>
        </footer>
      </div>
    </div>
  );
};

// ─── Home Page ──────────────────────────────────────────────────────────────

const HomePage: React.FC<{
  onSelectPolitician: (p: PoliticianSummary) => void;
  onLogoClick: () => void;
}> = ({ onSelectPolitician, onLogoClick }) => {
  const [politicians, setPoliticians] = useState<PoliticianSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMeta, setSearchMeta] = useState<DataMeta | null>(null);
  const [suggestions, setSuggestions] = useState<PoliticianSummary[]>([]);
  const [indexCount, setIndexCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const performSearch = async () => {
      try {
        setIsLoading(true);
        setIsLiveLoading(false);
        setError(null);

        const handleLiveUpdate = ({
          results,
          meta,
          suggestions: sugg,
          indexCount: count,
        }: import("./services/api").SearchResponse) => {
          if (cancelled) return;
          setPoliticians(results);
          setSearchMeta(meta);
          if (sugg) setSuggestions(sugg);
          if (count) setIndexCount(count);
          setIsLiveLoading(false);
        };

        const { results, meta, suggestions: sugg, indexCount: count } =
          await searchPoliticians(searchQuery, handleLiveUpdate);
        if (cancelled) return;
        setPoliticians(results);
        setSearchMeta(meta);
        setSuggestions(sugg || []);
        setIndexCount(count || 0);
        if (
          meta.source === "fallback" &&
          meta.reason?.includes("Live data loading")
        ) {
          setIsLiveLoading(true);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to search for politicians.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    performSearch();
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <>
      <header className="pt-10 pb-8">
        <Logo onClick={onLogoClick} />
        <p className="text-center text-text-secondary text-sm tracking-wide uppercase mt-3">
          Governance, Transparent.
        </p>
      </header>

      <main>
        <div className="max-w-4xl mx-auto">
          <GlobalSearchBar
            onSearch={handleSearch}
            isSearching={isLoading && searchQuery.length >= 2}
          />

          <div className="mt-6">
            {/* Data source indicator */}
            {searchMeta && !isLoading && (
              <div className="mb-4 flex items-center justify-between">
                {searchQuery.length < 2 ? (
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-text-primary">
                      Top Leaders
                    </h2>
                    <span className="text-[10px] font-medium text-accent bg-accent-muted px-1.5 py-0.5 rounded-badge">
                      Lok Sabha 2024
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <DataBadge meta={searchMeta} />
                    {isLiveLoading && (
                      <span className="text-[11px] text-accent animate-pulse">
                        Fetching live data…
                      </span>
                    )}
                  </div>
                )}
                <span className="text-xs text-text-tertiary font-data">
                  {politicians.length} result
                  {politicians.length !== 1 ? "s" : ""}
                  {indexCount > 0 && searchQuery.length < 2 && (
                    <span className="text-text-tertiary/50">
                      {" "}
                      of {indexCount.toLocaleString()}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface-secondary border border-surface-border p-5 rounded-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 skeleton rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 skeleton w-2/3" />
                        <div className="h-3 skeleton w-1/3" />
                        <div className="h-3 skeleton w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-text-tertiary text-xs mt-4">
                  {searchQuery.length >= 2
                    ? "Searching across election databases..."
                    : "Loading politicians..."}
                </p>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="text-center p-8 bg-surface-secondary rounded-card border border-status-danger/20">
                <svg
                  className="w-10 h-10 text-status-danger/60 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="text-status-danger text-sm font-medium mb-3">
                  {error}
                </p>
                <button
                  onClick={() => setSearchQuery((prev) => prev + " ")}
                  className="text-accent hover:text-accent-hover text-sm"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Results */}
            {!isLoading && !error && (
              <div className="space-y-2.5">
                {politicians.map((p) => {
                  const hasRichData =
                    p.criminalCases !== undefined || p.totalAssets;
                  const isLinkOnly = !hasRichData && p.profileUrl;

                  return (
                    <button
                      key={p.profileUrl}
                      onClick={() => onSelectPolitician(p)}
                      className={`w-full text-left bg-surface-secondary border p-4 rounded-card card-hover focus:outline-none focus:ring-2 focus:ring-accent/40 group ${
                        isLinkOnly
                          ? "border-accent/20"
                          : "border-surface-border"
                      }`}
                      aria-label={`View profile for ${p.name}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                          <span className="text-accent font-bold text-base">
                            {p.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                            {p.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-sm text-accent/80">
                              {p.party}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {p.constituency}
                            </span>
                            {p.election && (
                              <span className="text-xs bg-surface-tertiary text-text-tertiary px-2 py-0.5 rounded-badge">
                                {p.election}
                              </span>
                            )}
                          </div>
                          {hasRichData && (
                            <div className="flex flex-wrap gap-3 mt-2 text-xs font-data">
                              {p.criminalCases !== undefined && (
                                <span
                                  className={`${p.criminalCases > 0 ? "text-status-warning" : "text-status-clean"}`}
                                >
                                  {p.criminalCases > 0
                                    ? `${p.criminalCases} case${p.criminalCases > 1 ? "s" : ""}`
                                    : "No cases"}
                                </span>
                              )}
                              {p.totalAssets && (
                                <span className="text-text-tertiary">
                                  Assets: {p.totalAssets}
                                </span>
                              )}
                            </div>
                          )}
                          {isLinkOnly && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent-muted px-2 py-0.5 rounded-badge group-hover:bg-accent/20 transition-colors">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                  />
                                </svg>
                                Fetch full profile
                              </span>
                              <span className="text-[10px] text-text-tertiary">
                                from myneta.info
                              </span>
                            </div>
                          )}
                        </div>
                        <svg
                          className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  );
                })}

                {/* No results — show fuzzy suggestions from index */}
                {politicians.length === 0 && (
                  <div className="py-8 px-2">
                    {suggestions.length > 0 ? (
                      <>
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-semibold text-text-primary mb-1">
                            Did you mean?
                          </h3>
                          <p className="text-text-secondary text-sm">
                            No exact match for "
                            <span className="text-accent">{searchQuery}</span>
                            " — showing closest matches from{" "}
                            <span className="font-data text-accent">
                              {indexCount.toLocaleString()}
                            </span>{" "}
                            indexed politicians
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          {suggestions.map((p) => (
                            <button
                              key={p.profileUrl}
                              onClick={() => onSelectPolitician(p)}
                              className="w-full text-left bg-surface-secondary border border-accent/20 p-4 rounded-card card-hover focus:outline-none focus:ring-2 focus:ring-accent/40 group"
                              aria-label={`View profile for ${p.name}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                                  <span className="text-accent font-bold text-base">
                                    {p.name.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                                    {p.name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    <span className="text-sm text-accent/80">
                                      {p.party}
                                    </span>
                                    <span className="text-xs text-text-tertiary">
                                      {p.constituency}
                                    </span>
                                    {p.election && (
                                      <span className="text-xs bg-surface-tertiary text-text-tertiary px-2 py-0.5 rounded-badge">
                                        {p.election}
                                      </span>
                                    )}
                                  </div>
                                  {(p.criminalCases !== undefined ||
                                    p.totalAssets) && (
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-data">
                                      {p.criminalCases !== undefined && (
                                        <span
                                          className={`${p.criminalCases > 0 ? "text-status-warning" : "text-status-clean"}`}
                                        >
                                          {p.criminalCases > 0
                                            ? `${p.criminalCases} case${p.criminalCases > 1 ? "s" : ""}`
                                            : "No cases"}
                                        </span>
                                      )}
                                      {p.totalAssets && (
                                        <span className="text-text-tertiary">
                                          Assets: {p.totalAssets}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <svg
                                  className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-6">
                          <RequestPolitician prefillName={searchQuery} />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <svg
                          className="w-12 h-12 text-surface-border mx-auto mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          No politicians found
                        </h3>
                        <p className="text-text-secondary text-sm mb-4">
                          No results for "
                          <span className="text-accent">{searchQuery}</span>"
                          across {indexCount.toLocaleString()} indexed
                          politicians
                        </p>
                        <p className="text-xs text-text-tertiary mb-6">
                          Try a full name, constituency, or state — e.g.,
                          "Narendra Modi", "Varanasi"
                        </p>
                        <RequestPolitician prefillName={searchQuery} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Request a politician + Coming Soon — shown below results */}
            {!isLoading && !error && politicians.length > 0 && (
              <>
                <div className="mt-6">
                  <RequestPolitician />
                </div>
                <ComingSoonSection />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

// ─── Profile Page ───────────────────────────────────────────────────────────

const ProfilePage: React.FC<{
  slug: string;
  onNavigateHome: () => void;
}> = ({ slug, onNavigateHome }) => {
  const [politician, setPolitician] = useState<{
    profileUrl: string;
    name: string;
    party: string;
    constituency: string;
    totalAssets?: string;
    election?: string;
  } | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [resolveError, setResolveError] = useState(false);

  const displayName = slugToName(slug);

  // Update OG meta tags for this politician
  useEffect(() => {
    const title = `${politician?.name || displayName} — Project Vigil`;
    const description = politician
      ? `View ${politician.name}'s assets, criminal cases, and parliamentary record. ${politician.party} — ${politician.constituency}.`
      : `View ${displayName}'s profile on Project Vigil.`;
    const ogImageUrl = `/api/og?name=${encodeURIComponent(politician?.name || displayName)}${politician?.party ? `&party=${encodeURIComponent(politician.party)}` : ''}${politician?.constituency ? `&constituency=${encodeURIComponent(politician.constituency)}` : ''}${politician?.totalAssets ? `&assets=${encodeURIComponent(politician.totalAssets)}` : ''}`;

    document.title = title;

    const setMeta = (property: string, content: string) => {
      const selector = property.startsWith('og:')
        ? `meta[property="${property}"]`
        : `meta[name="${property}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (property.startsWith('og:')) {
          el.setAttribute('property', property);
        } else {
          el.setAttribute('name', property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:image', ogImageUrl);
    setMeta('og:type', 'profile');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImageUrl);

    return () => {
      document.title = 'PROJECT VIGIL — Transparent Governance Dashboard';
      setMeta('og:title', 'PROJECT VIGIL — Transparent Governance Dashboard');
      setMeta('og:description', 'Track assets, criminal cases, and parliamentary performance of Indian politicians. Data from public election affidavits.');
      setMeta('og:image', '/project-vigil.png');
      setMeta('og:type', 'website');
      setMeta('twitter:title', 'PROJECT VIGIL — Transparent Governance Dashboard');
      setMeta('twitter:description', 'Track assets, criminal cases, and parliamentary performance of Indian politicians. Data from public election affidavits.');
      setMeta('twitter:image', '/project-vigil.png');
    };
  }, [politician, displayName]);

  // Resolve slug to politician data
  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);
    setResolveError(false);
    setPolitician(null);

    searchPoliticians(slugToName(slug))
      .then(({ results }) => {
        if (cancelled) return;
        const match =
          results.find((p) => toSlug(p.name) === slug) || results[0];
        if (match) {
          setPolitician({
            profileUrl: match.profileUrl,
            name: match.name,
            party: match.party,
            constituency: match.constituency,
            totalAssets: match.totalAssets,
            election: match.election,
          });
        } else {
          setResolveError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setResolveError(true);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <>
      {/* Compact header */}
      <header className="pt-6 pb-4">
        <Logo onClick={onNavigateHome} />
        <p className="text-center text-text-secondary text-sm tracking-wide uppercase mt-3">
          Governance, Transparent.
        </p>
      </header>

      <main>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-text-tertiary mb-6"
          >
            <button
              onClick={onNavigateHome}
              className="hover:text-accent transition-colors"
            >
              Home
            </button>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-text-primary font-medium truncate">
              {politician?.name || displayName}
            </span>
          </nav>

          {/* Resolving / loading state */}
          {isResolving && (
            <div className="bg-surface-secondary border border-surface-border p-6 rounded-card">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 skeleton rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 skeleton w-1/2" />
                  <div className="h-4 skeleton w-1/3" />
                  <div className="h-3 skeleton w-1/4" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-4 skeleton w-full" />
                <div className="h-4 skeleton w-5/6" />
                <div className="h-4 skeleton w-2/3" />
              </div>
              <p className="text-center text-text-tertiary text-xs mt-6">
                Loading profile for {displayName}...
              </p>
            </div>
          )}

          {/* Error state */}
          {resolveError && !isResolving && (
            <div className="text-center p-8 bg-surface-secondary rounded-card border border-status-danger/20">
              <svg
                className="w-10 h-10 text-status-danger/60 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-status-danger text-sm font-medium mb-2">
                Could not find politician "{displayName}"
              </p>
              <p className="text-text-tertiary text-xs mb-4">
                The profile may have been moved or the name may be misspelled.
              </p>
              <button
                onClick={onNavigateHome}
                className="text-accent hover:text-accent-hover text-sm"
              >
                Search for politicians
              </button>
            </div>
          )}

          {/* Profile */}
          {politician && !isResolving && (
            <div className="animate-fade-in">
              <PoliticianProfile
                profileUrl={politician.profileUrl}
                politicianName={politician.name}
                politicianParty={politician.party}
                politicianConstituency={politician.constituency}
                indexTotalAssets={politician.totalAssets}
                indexElection={politician.election}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default App;
