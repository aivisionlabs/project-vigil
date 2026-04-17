# PROJECT VIGIL - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** April 18, 2026
**Status:** Proof of Concept (PoC)

---

## 1. Executive Summary

**PROJECT VIGIL** is a transparent governance dashboard that aggregates and visualizes publicly available data about Indian politicians. The application enables citizens to search for politicians, view their declared assets, criminal cases, and associated government audit findings — all sourced from public records such as election affidavits, court filings, and CAG/CVC reports.

The goal is to make political accountability data accessible, understandable, and actionable for everyday citizens.

---

## 2. Problem Statement

Public data on Indian politicians — asset declarations, criminal records, audit findings — is scattered across multiple government websites (Election Commission, CAG, CVC, myneta.info). The data is hard to find, difficult to interpret, and not presented in a way that enables meaningful comparison or analysis.

Citizens lack a unified, visual, and easy-to-use platform to evaluate the transparency and accountability of their elected representatives.

---

## 3. Target Audience

| Segment | Description |
|---|---|
| **General Citizens** | Indian voters who want to make informed decisions about their elected representatives |
| **Journalists** | Reporters covering governance, corruption, and political accountability |
| **Civil Society Organizations** | NGOs and watchdog groups focused on transparency and anti-corruption |
| **Researchers** | Academics studying Indian governance, public policy, and political science |

---

## 4. Product Goals

1. **Transparency** — Surface publicly available governance data in an accessible format
2. **Simplicity** — Present complex financial and legal data through intuitive visualizations
3. **Accountability** — Enable citizens to track asset growth, criminal records, and audit findings for politicians
4. **Actionability** — Provide tools (RTI templates) that empower citizens to request additional information

---

## 5. Features & Functional Requirements

### 5.1 Global Search

| Attribute | Detail |
|---|---|
| **Description** | Search bar to find politicians by name or constituency |
| **Behavior** | Debounced input (300ms); case-insensitive substring matching on name and constituency; returns full list when query is empty |
| **Priority** | P0 (Core) |

**Acceptance Criteria:**
- User can type a politician's name or constituency and see matching results in real-time
- Results update as the user types with no perceptible lag
- Empty search query returns the complete list of all politicians

---

### 5.2 Politician Search Results

| Attribute | Detail |
|---|---|
| **Description** | List of politician cards showing name, party, and constituency |
| **Behavior** | Clickable cards that navigate to the politician's full profile |
| **Priority** | P0 (Core) |

**Acceptance Criteria:**
- Each result card displays: name, party affiliation, constituency
- Clicking a card opens the detailed profile view
- Results are filtered dynamically based on the search query

---

### 5.3 Politician Profile View

| Attribute | Detail |
|---|---|
| **Description** | Detailed profile page for a selected politician |
| **Sections** | Profile Header, Asset Growth Chart, Criminal Cases Table, Associated Report Findings |
| **Priority** | P0 (Core) |

#### 5.3.1 Profile Header

Displays:
- Politician photo (or generated avatar placeholder)
- Full name
- Party affiliation
- Constituency
- Education

#### 5.3.2 Asset Growth Chart

| Attribute | Detail |
|---|---|
| **Description** | Line chart visualizing a politician's declared asset growth over time compared to a market index (Sensex/Nifty) |
| **Data Source** | Election affidavit asset declarations (year, total assets, liabilities) |
| **Visualization** | Recharts line chart with dual lines — politician's asset growth vs. market index growth (percentage-based) |
| **Interactions** | Interactive tooltips showing growth percentages |
| **Minimum Data** | Requires at least 2 asset declarations to render |
| **Fallback** | Displays RTI Helper component when insufficient data is available |
| **Priority** | P0 (Core) |

**Acceptance Criteria:**
- Chart renders when 2+ asset declaration data points exist
- Both politician asset growth and market index lines are visible and distinguishable
- Tooltips show exact growth percentages on hover
- When insufficient data exists, the RTI Helper is shown instead

#### 5.3.3 Criminal Cases Table

| Attribute | Detail |
|---|---|
| **Description** | Table listing criminal cases associated with the politician |
| **Columns** | IPC Section, Description, Status, Source |
| **Status Values** | Pending (yellow), Convicted (red), Acquitted (green) |
| **Priority** | P0 (Core) |

**Acceptance Criteria:**
- All known criminal cases are listed
- Status is color-coded: yellow for Pending, red for Convicted, green for Acquitted
- Each case includes a source link to the original record

#### 5.3.4 Associated Report Findings (AI-Generated)

| Attribute | Detail |
|---|---|
| **Description** | AI-summarized audit findings from CAG/CVC reports associated with the politician's portfolio |
| **AI Model** | Google Gemini 2.5 Flash |
| **Output** | 2-3 findings per politician, each containing: department name, finding summary, presumptive loss (in crores), source report page reference |
| **Tone** | Neutral, bureaucratic — focuses on procedural lapses and inefficiencies |
| **Fallback** | Returns pre-defined fallback data if the Gemini API fails |
| **Priority** | P1 (Important) |

**Acceptance Criteria:**
- Findings are displayed with department name, summary, loss amount, and source
- AI-generated summaries are clearly labeled as AI-generated
- If the API is unavailable, fallback data is shown without error to the user

---

### 5.4 RTI Helper

| Attribute | Detail |
|---|---|
| **Description** | Pre-filled Right to Information (RTI) request template for requesting political affidavits |
| **Behavior** | One-click copy-to-clipboard; direct link to rtionline.gov.in |
| **Trigger** | Shown when asset declaration data is insufficient for chart rendering |
| **Priority** | P1 (Important) |

**Acceptance Criteria:**
- Template text is pre-filled and relevant to the selected politician
- Copy-to-clipboard button works reliably
- External link to RTI portal opens in a new tab

---

### 5.5 Session Disclaimer Modal

| Attribute | Detail |
|---|---|
| **Description** | Modal informing users that data is from public records and the app is a proof-of-concept |
| **Behavior** | Displayed on first visit per session; stored in sessionStorage; dismissed on acknowledgment |
| **Priority** | P2 (Nice to have) |

**Acceptance Criteria:**
- Modal appears on first visit
- Modal does not re-appear after user acknowledges it (within the same session)
- Content clearly states the data source and PoC nature

---

### 5.6 Navigation & UX

| Attribute | Detail |
|---|---|
| **Back Navigation** | Button to return from profile view to search results |
| **Loading States** | Skeleton loaders during data fetch |
| **Error Handling** | User-facing error messages with console logging for debugging |
| **Priority** | P0 (Core) |

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3 (CDN) |
| **Charts** | Recharts 3 |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Database (Planned)** | Supabase (scaffolded, not active) |
| **Scraping (Planned)** | Python (BeautifulSoup4, requests) |
| **Deployment** | Vercel |

### 6.2 Application Architecture

```
┌──────────────────────────────────────────────┐
│                   App.tsx                     │
│         (State: search vs. profile view)      │
├──────────────┬───────────────────────────────┤
│              │                               │
│  GlobalSearchBar                             │
│              │                               │
├──────────────┼───────────────────────────────┤
│              ▼                               │
│   Search Results     OR    PoliticianProfile │
│   (PoliticianSummary[])    ├─ ProfileHeader  │
│                            ├─ AssetGrowthChart│
│                            │  (or RtiHelper)  │
│                            ├─ CriminalCases   │
│                            └─ ReportFindings  │
├──────────────────────────────────────────────┤
│              services/api.ts                 │
│     (Data fetching, Gemini API calls)        │
├──────────────────────────────────────────────┤
│           data/*.ts (Mock Data)              │
└──────────────────────────────────────────────┘
```

### 6.3 Data Flow

1. **Search**: User input → debounce (300ms) → `searchPoliticians()` → filter mock data → update UI
2. **Profile**: Card click → `getPoliticianProfile(profileUrl)` → map to data file → render profile
3. **Reports**: Profile load → `getAssociatedReports(profileUrl)` → Gemini API (or fallback) → render findings

### 6.4 Data Model

```typescript
PoliticianSummary {
  profileUrl: string
  name: string
  party: string
  constituency: string
}

PoliticianProfileData extends PoliticianSummary {
  education: string
  photoUrl: string
  assetDeclarations: AssetDeclaration[]
  criminalCases: CriminalCase[]
}

AssetDeclaration {
  year: number
  totalAssets: number
  liabilities: number
  sourceUrl: string
  indexGrowthPercentage?: number
}

CriminalCase {
  ipcSection: string
  description: string
  status: 'Pending' | 'Convicted' | 'Acquitted'
  sourceUrl: string
}

AssociatedReport {
  department_name: string
  finding_summary: string
  loss_amount_rs_crore: string
  source_report_page: string
  sourceUrl: string
}
```

---

## 7. Current Data Coverage

| Politician | Party | Constituency | Asset Data | Criminal Cases | AI Reports |
|---|---|---|---|---|---|
| Amit Shah | BJP | Gandhinagar | 3 declarations (2012-2019) | 4 cases (all acquitted) | Yes (Gemini) |
| Tejashwi Prasad Yadav | RJD | Raghopur | 2 declarations (2015-2020) | 4+ cases (pending) | Fallback |
| Dilip Kumar Jaiswal | JD(U) | Rupauli | 3 declarations (2010-2020) | 2+ cases | Fallback |
| Manoj Manzil | — | — | Available | Available | Fallback |
| Jagannath Mishra | — | — | Available | Available | Fallback |
| Samrat Choudhary | — | — | Available | Available | Fallback |
| Bihar 2020 BJP (4 MLAs) | BJP | Various | Summary only | Summary only | No |

---

## 8. Design & Theming

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `brand-dark` | `#1a202c` | Background, primary surfaces |
| `brand-medium` | `#2d3748` | Card backgrounds, secondary surfaces |
| `brand-light` | `#4a5568` | Borders, dividers |
| `brand-accent` | `#f6ad55` | CTAs, accent highlights, links |
| `brand-text` | `#e2e8f0` | Primary text |
| `brand-subtle` | `#a0aec0` | Secondary/muted text |

### Design Principles
- Dark theme throughout
- Mobile-responsive (Tailwind `md:` breakpoints)
- Skeleton loading states for perceived performance
- Fade-in animations for content transitions
- Color-coded status indicators for quick scanning

---

## 9. Environment & Configuration

| Variable | Purpose | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API for AI-generated report summaries | Yes (for AI features) |
| Supabase URL | Database connection (not yet active) | No (future) |
| Supabase Anon Key | Database auth (not yet active) | No (future) |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Performance** | Search results render within 300ms of typing pause |
| **Availability** | Graceful degradation when Gemini API is down (fallback data) |
| **Responsiveness** | Fully usable on mobile, tablet, and desktop |
| **Accessibility** | Semantic HTML, color-coded statuses supplemented with text labels |
| **Security** | API keys stored as environment variables, not in client code |

---

## 11. Known Limitations (Current PoC)

1. **Mock Data Only** — All politician data is hardcoded; no live database
2. **Limited Coverage** — Only 7 politician profiles (primarily Bihar-focused)
3. **AI Features Limited** — Gemini-powered reports only available for Amit Shah's profile
4. **No Authentication** — No user accounts or access control
5. **No Real-Time Updates** — Data is static and updated only via code changes
6. **Supabase Not Active** — Database client is scaffolded but not connected
7. **Scraper Not Operational** — Python scraper exists as compiled binary but is not integrated

---

## 12. Future Roadmap

### Phase 2: Data Pipeline
- [ ] Activate Supabase database integration
- [ ] Operationalize Python scraper for automated data ingestion from myneta.info, ECI, and CAG
- [ ] Expand politician coverage to all Lok Sabha and Rajya Sabha members
- [ ] Implement scheduled data refresh (cron-based scraping)

### Phase 3: Enhanced Features
- [ ] Enable AI-generated report summaries for all politicians (not just Amit Shah)
- [ ] Comparative analysis tool (compare 2+ politicians side-by-side)
- [ ] Constituency-level aggregated views
- [ ] Historical trend analysis across election cycles
- [ ] Bookmark/watchlist for tracking specific politicians

### Phase 4: Platform Maturity
- [ ] User authentication and personalized dashboards
- [ ] Community contributions and data verification
- [ ] Embed widgets for media and NGO websites
- [ ] Push notifications for new case updates or asset declarations
- [ ] Multi-language support (Hindi, regional languages)
- [ ] API access for third-party developers and researchers

---

## 13. Success Metrics

| Metric | Target |
|---|---|
| **Search Accuracy** | Relevant results returned for 95%+ of queries |
| **Page Load** | Profile page renders in < 2 seconds |
| **AI Report Quality** | Findings are factually plausible and neutrally toned |
| **User Engagement** | RTI template copy-to-clipboard usage tracked |
| **Coverage** | Expand from 7 to 500+ politician profiles (Phase 2) |

---

## 14. Appendix

### A. Data Sources (Referenced)
- **myneta.info** — Election affidavit data (assets, criminal cases)
- **cag.gov.in** — Comptroller and Auditor General reports
- **CVC** — Central Vigilance Commission reports
- **rtionline.gov.in** — RTI filing portal

### B. Development Commands
```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
```
