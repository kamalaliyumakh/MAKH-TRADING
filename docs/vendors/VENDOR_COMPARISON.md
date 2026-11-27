# MAKH Trading Platform — Data and Evidence Vendor Comparison

Last updated: 12 August 2026  
Research basis: official provider/regulator sources available on the review date

## Shortlist by capability

| Capability | Leading research candidate | Secondary / authority source | Current disposition |
|---|---|---|---|
| Real-time U.S. trades, NBBO quotes, bars, conditions and LULD | Massive | Broker feed may be used for execution cross-check only | Preferred technical proof-of-concept; business licence pending |
| Historical tick/bar replay | Massive flat files/REST | Databento subject to U.S.-equity dataset and licence confirmation | Preferred technical proof-of-concept; rights/cost pending |
| Security master/corporate actions | Massive reference endpoints | SEC identifiers/issuer filings for verification | Candidate; identifier/correction tests pending |
| Public float/shares | Financial Modeling Prep float endpoints | Issuer filings/SEC facts as verification evidence, not a simple authoritative float field | Candidate only; definition, accuracy and commercial display agreement pending |
| SEC filings | SEC EDGAR APIs/bulk archives | Commercial normalized provider if latency/support needs justify it | Preferred authoritative source; fair-access implementation required |
| Company/market news | Finnhub or FMP commercial plan | Issuer newsroom/SEC/press-release original URL | Shortlist only; publisher/full-text/display rights pending |
| Press releases | Issuer/newsroom plus licensed aggregator | Finnhub enterprise/FMP commercial | Metadata/link-first approach pending contract |
| Social attention | None enabled | Reddit/X/other only under explicit commercial API agreement | Deferred; disabled by default |

## Evidence and limitations

- Massive documents U.S. market coverage across major exchanges, FINRA facilities and dark pools using REST, WebSocket and flat files. It exposes trades, NBBO quotes, aggregates, condition codes and LULD events: https://massive.com/docs/rest/stocks and https://massive.com/docs/websocket/stocks/overview
- FMP documents bulk/company float data, including float shares and shares outstanding, with a daily cycle. Its pricing page says display or redistribution requires a specific agreement: https://site.financialmodelingprep.com/developer/docs/stable/all-shares-float and https://site.financialmodelingprep.com/developer/docs/pricing/
- SEC EDGAR's submissions and XBRL APIs update close to filing dissemination and bulk archives are rebuilt nightly. Automated access must comply with SEC policies: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- Finnhub documents company news, real-time premium news and press-release feeds; commercial/redistribution rights are an enterprise contract question: https://finnhub.io/docs/api/quote and https://finnhub.io/pricing-startups-and-enterprise
- Reddit's current Data API Terms require a separate agreement for commercial use or uses outside permitted terms: https://redditinc.com/policies/data-api-terms

## Provisional architecture recommendation

1. Use separate provider ports for market, reference and evidence data.
2. Prototype SIP market ingestion/replay against Massive only after development terms are accepted.
3. Prototype float using FMP while recording exact definition, observed date and revision; never silently substitute shares outstanding.
4. Ingest SEC submissions/filing metadata directly using a compliant identity/User-Agent, bounded rate policy, cache and nightly bulk recovery.
5. Use news metadata and original-source links until full-text/display/storage rights are signed.
6. Keep social ingestion disabled. A manual link or user note does not become verified catalyst evidence.

This recommendation is technical and provisional. It is not a purchase, licence or production-use decision.

