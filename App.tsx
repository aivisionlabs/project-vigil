import React, { useState, useEffect, useCallback } from "react";
import { GlobalSearchBar } from "./components/GlobalSearchBar";
import { PoliticianProfile } from "./components/PoliticianProfile";
import { DisclaimerModal } from "./components/DisclaimerModal";
import { DataBadge } from "./components/DataBadge";
import { ComingSoonSection } from "./components/ComingSoonSection";
import { searchPoliticians, hasCachedProfile } from "./services/api";
import type { PoliticianSummary, DataMeta } from "./types";

// ─── Simple slug helpers ─────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseRoute(): { page: "home" | "profile"; slug?: string } {
  const path = window.location.pathname;
  const match = path.match(/^\/politician\/([^?/]+)/);
  if (match) {
    return { page: "profile", slug: decodeURIComponent(match[1]) };
  }
  return { page: "home" };
}

// ─── App ─────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [politicians, setPoliticians] = useState<PoliticianSummary[]>([]);
  const [route, setRoute] = useState(parseRoute);
  const [selectedPolitician, setSelectedPolitician] = useState<{
    profileUrl: string;
    name: string;
    party: string;
    constituency: string;
    isCached: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMeta, setSearchMeta] = useState<DataMeta | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(
    !sessionStorage.getItem("disclaimerAcknowledged"),
  );

  // Listen for browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const newRoute = parseRoute();
      setRoute(newRoute);
      if (newRoute.page === "home") {
        setSelectedPolitician(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // If arriving directly to a /politician/<slug> URL, search by slug to find the politician
  useEffect(() => {
    if (route.page === "profile" && !selectedPolitician && route.slug) {
      const name = slugToName(route.slug);
      searchPoliticians(name).then(({ results }) => {
        // Find best match from results
        const match = results.find(
          (p) => toSlug(p.name) === route.slug
        ) || results[0];
        if (match) {
          setSelectedPolitician({
            profileUrl: match.profileUrl,
            name: match.name,
            party: match.party,
            constituency: match.constituency,
            isCached: false,
          });
        }
      });
    }
  }, [route, selectedPolitician]);

  // Search
  useEffect(() => {
    if (route.page !== "home") return;
    const performSearch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { results, meta } = await searchPoliticians(searchQuery);
        setPoliticians(results);
        setSearchMeta(meta);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to search for politicians.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    performSearch();
  }, [searchQuery, route.page]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // If on profile page, navigate back to home
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
      setRoute({ page: "home" });
      setSelectedPolitician(null);
    }
  }, []);

  const handleSelectPolitician = (p: PoliticianSummary) => {
    const slug = toSlug(p.name);
    window.history.pushState(null, "", `/politician/${slug}`);
    setRoute({ page: "profile", slug });
    setSelectedPolitician({
      profileUrl: p.profileUrl,
      name: p.name,
      party: p.party,
      constituency: p.constituency,
      isCached: searchMeta?.source === "cache" && hasCachedProfile(p.profileUrl),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToSearch = () => {
    window.history.pushState(null, "", "/");
    setRoute({ page: "home" });
    setSelectedPolitician(null);
  };

  const handleAcknowledgeDisclaimer = () => {
    sessionStorage.setItem("disclaimerAcknowledged", "true");
    setShowDisclaimer(false);
  };

  if (showDisclaimer) {
    return <DisclaimerModal onClose={handleAcknowledgeDisclaimer} />;
  }

  const isProfilePage = route.page === "profile" && selectedPolitician;

  return (
    <div className="bg-surface-primary min-h-screen text-text-primary font-sans">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        {/* Header */}
        <header className="pt-10 pb-8">
          <button
            onClick={handleBackToSearch}
            className="flex items-center justify-center gap-3 mb-3 mx-auto group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <svg
                className="w-5 h-5 text-text-inverse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary group-hover:text-accent transition-colors">
              PROJECT <span className="text-accent">VIGIL</span>
            </h1>
          </button>
          <p className="text-center text-text-secondary text-sm tracking-wide uppercase">
            Governance, Transparent.
          </p>
        </header>

        <main>
          <div className="max-w-4xl mx-auto">
            <GlobalSearchBar
              onSearch={handleSearch}
              isSearching={isLoading && searchQuery.length >= 2}
            />

            {isProfilePage ? (
              <div className="mt-6 animate-fade-in">
                <button
                  onClick={handleBackToSearch}
                  aria-label="Back to search results"
                  className="mb-5 text-text-secondary hover:text-accent transition-colors flex items-center gap-2 text-sm group"
                >
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to results
                </button>
                <PoliticianProfile
                  profileUrl={selectedPolitician.profileUrl}
                  politicianName={selectedPolitician.name}
                  politicianParty={selectedPolitician.party}
                  politicianConstituency={selectedPolitician.constituency}
                  isCached={selectedPolitician.isCached}
                />
              </div>
            ) : (
              <div className="mt-6">
                {/* Data source indicator */}
                {searchMeta && !isLoading && (
                  <div className="mb-4 flex items-center justify-between">
                    <DataBadge meta={searchMeta} />
                    <span className="text-xs text-text-tertiary font-data">
                      {politicians.length} result
                      {politicians.length !== 1 ? "s" : ""}
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
                    <p className="text-status-danger text-sm font-medium mb-3">{error}</p>
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
                    {politicians.map((p) => (
                      <button
                        key={p.profileUrl}
                        onClick={() => handleSelectPolitician(p)}
                        className="w-full text-left bg-surface-secondary border border-surface-border p-4 rounded-card card-hover focus:outline-none focus:ring-2 focus:ring-accent/40 group"
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

                    {/* No results */}
                    {politicians.length === 0 && (
                      <div className="text-center py-16 px-6">
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
                          <span className="text-accent">
                            {searchQuery}
                          </span>
                          "
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Try a full name, constituency, or state — e.g., "Narendra Modi", "Varanasi"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Coming Soon Section - shown below results on home */}
                {!isLoading && !error && politicians.length > 0 && (
                  <ComingSoonSection />
                )}
              </div>
            )}
          </div>
        </main>

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

export default App;
