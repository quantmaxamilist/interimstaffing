# Interim Staffing: local SEO findings and actions

Researched 14–15 Oct 2026 from raw sources: Google autocomplete, live Google results pages,
Companies House, and the business's own job posts. Searches were run from a UK browser with the
place name in the query; Google's location detection put it in Milford Haven or Beverley, so
map-pack results for queries without a place name will differ for searchers in Hull.

## 1. What the evidence says

**The business**
- **Companies House:** Interim Staffing Ltd, company no. 12107128, SIC 78200 (temporary employment
  agency), registered office Grove Farm, Goodmanham, York YO43 3HX (East Riding of Yorkshire). Sole
  director Clare Coleman. <https://find-and-update.company-information.service.gov.uk/company/12107128>
- **LinkedIn:** Clare Coleman, "Director of Interim Staffing | 35 years experience | Contact:
  clare@interimemployment.co.uk", with the job title "Managing Director · Interim Employment". The
  business trades under two names, which explains the email domain.
- **Where they actually place people:** their phone number appears on GOV.UK Find a Job and in local
  Facebook job groups. The adverts include press brake/CNC and factory labour in Hull, a greenhouse
  role, non-food work in the Goole job group, an HGV 2/HIAB driver in the Scarborough area, a
  Category Manager, and a Recruitment/HR role. That covers Hull, the East Riding, Goole and North
  Yorkshire, which is wider than a single town.

**Indexing and brand**
- `site:interimstaffing.co.uk` returns 4 pages: Home, Candidates, Clients, Contact Us.
- The brand query "interim staffing" returns the site at **#1**, but with **no knowledge panel**,
  because there is no Google Business Profile. Interim-management firms (Green Park, Indeed) buy ads
  on the phrase.
- Google shows the old site's own meta descriptions as snippets. The first rebuild had replaced them;
  they are now restored word for word.

**What people search for** (Google autocomplete, en-GB; raw data in `docs/autocomplete-2026-10-15.json`)
- Hull is the local hub: "recruitment agency hull" (10 suggestions, including "…hull east yorkshire"),
  "engineering recruitment hull" / "…agencies hull", "construction recruitment agencies hull",
  "temp agency hull", "job agency hull", "staffing agency hull".
- Beverley, Driffield and Goole get 1–3 suggestions each; **Market Weighton gets none**.
- Sector demand also appears at regional level: "engineering recruitment agency yorkshire",
  "permanent recruitment agency".

**Who wins those searches**

| Query | Map pack (Google category · rating · reviews) | Organic pattern |
|---|---|---|
| engineering recruitment agency hull | Holt Engineering (Recruiter · 4.9 · 627, based in Bournemouth), Prestige (Recruiter · 4.3 · 1.1k, Hull), Hello (Recruiter · 5.0 · 16, Hull) | Every winner has a dedicated "Engineering Recruitment Hull" page |
| recruitment agency beverley | James Ray (Recruiter · 5.0 · 270), Orchard Professional (Recruiter · 3.7 · 11, family-owned), Steve Ball (Recruiter · 4.2 · **5**) | Agency Central and Cylex directories rank on page 1 |
| permanent recruitment agency yorkshire | One to One Recruitment, York (Recruiter · 4.9 · 195) shown as a single listing | Reed office list, Agency Central, agency home pages |

Takeaways:
1. **Every map pack uses the "Recruiter" category, and none of these places requires a big review
   count.** In Beverley a listing with 5 reviews appears. A Business Profile is the biggest single gain
   available, and the website can't substitute for it.
2. **Agency Central** ranks on page 1 for both the Beverley and the Yorkshire query, so it's a
   citation worth having.
3. The sector and town pages competitors use ("Engineering Recruitment Hull") need real copy. The
   current site has one paragraph per sector, so I haven't invented any (see section 4).

## 2. Changes made to the site

| Change | Why | Check |
|---|---|---|
| Restored the old site's meta descriptions word for word (Home, Clients, Candidates, Contact) | Google displays them as the indexed snippets | Matches the live site's `<meta name="description">` |
| Meta descriptions for the 3 permanent pages and the 2 legal pages (marked **draft**) | They had none | All ≤ 160 characters |
| Structured data on every page: `EmploymentAgency` (name, legal name, company no., address, geo, phone, email, areas served, services), `WebSite`, `BreadcrumbList` on inner pages, and `Service` on the permanent pages | Lets Google tie the site to the business and its location | 493 properties checked against the official schema.org vocabulary plus Google's required fields: **0 errors**. The checker was tested on a deliberately broken sample and caught all 14 planted errors |
| Footer: legal name, company number, place of registration, registered office | UK companies law requires this on company websites | On every page |
| Contact page: registered-office block, plus Google links once they exist | NAP (name, address, phone) consistency | — |
| Google review sections on Home, Clients, Candidates and the 3 permanent pages (each page shows its own audience's reviews first). Footer and contact links switch on automatically | Ready for the Business Profile | Hidden in production until real data is added; tested with dummy data, which was then removed |
| `robots.txt` pointing to the sitemap; `og:site_name`, `og:locale`, Twitter card, geo meta | Basic crawl and sharing hygiene | — |
| Solid header on pages without a dark hero; footer headings changed h4 → h2 | Lighthouse colour-contrast and heading-order failures | — |

**Lighthouse** on the production build: SEO, Accessibility and Best Practices all score **100** on
every page. The 404 page is set to noindex on purpose.
Link crawl: 42 URLs, no 404s; every old URL redirects once.

## 3. Actions only Clare can take, in order of impact

1. **Create a Google Business Profile.** Primary category **Recruiter**, which every competitor in
   these map packs uses; secondary category **Employment agency**. Set it up as a **service-area
   business** with the address hidden, since Grove Farm may be a private address. List the service
   areas from where they actually place people: Hull, East Riding of Yorkshire, Goole, Scarborough
   / North Yorkshire. Use the same name, phone and website as the site.
2. **Put the profile links into the site.** In `src/data/site.ts`, set `google.profileUrl` and
   `google.reviewUrl` (Business Profile → "Ask for reviews" gives the short link). Add the rating,
   count and reviews **copied word for word**. The review sections appear on the next build.
3. **Ask for reviews.** Send the review link to employers after each placement and to candidates
   after their start date. Add it to the email signature and the follow-ups on job adverts. Google's
   policy bans offering incentives and only asking happy customers.
4. **Pick one trading name** for all listings: Interim Staffing or Interim Employment. Ideally move
   the email to the `interimstaffing.co.uk` domain, then make LinkedIn match.
5. **Citations,** with an identical name, phone and website on each: Bing Places (can import from
   Google), Apple Business Connect, Agency Central, Yell, Cylex, a LinkedIn company page and a
   Facebook page. Add each new profile to `sameAs` in `src/layouts/Base.astro`.
6. **Search Console:** after go-live, verify the domain, submit `sitemap-index.xml`, and watch which
   queries the site gets impressions for. That's the real demand data autocomplete can only hint at.

## 4. Recommended next, but not done (they need client input)

- **Location in titles.** The old titles all say "| UK |". Adding "Hull & East Yorkshire" to the Home
  and Contact titles would target the local queries above. I haven't changed them, because the
  current titles hold the #1 brand ranking and the client describes the agency as UK-wide. Client
  decision.
- **Sector pages** (Engineering, Industrial, Construction) with real copy from Clare: roles placed,
  client types, areas. This is the pattern every organic winner uses. Don't publish thin or
  town-swapped pages; Google treats them as doorway pages.
- **A Jobs page or feed.** They already advertise on GOV.UK Find a Job and in Facebook groups. Live
  vacancies on the site, marked up as `JobPosting`, could appear in Google's jobs listings.
- **Opening hours** (recommended by Google for local businesses) are unknown, so they're omitted.

## 5. How to measure it (not dependent on us)

- Search Console impressions and position for the queries in section 1, as a baseline for the first
  3 months after launch.
- Whether the Business Profile appears in the map packs above, rechecked monthly from a Hull location.
- The review count on the Business Profile.
- After deploy: the Google Rich Results Test on the live URL.
