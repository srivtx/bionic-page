# Performance

Measured with `bun run bench` (see `scripts/bench.ts`): synthetic articles built
with linkedom, transformed with the default `half` mode, then reverted exactly.
Local run, Apple M-series, 2026-09-19.

| Paragraphs | Words | Transform | Revert | Throughput |
|---:|---:|---:|---:|---:|
| 100 | 4,500 | 25.4 ms | 2.2 ms | 177k words/s |
| 500 | 22,500 | 97.1 ms | 3.3 ms | 232k words/s |
| 1,000 | 45,000 | 253.7 ms | 5.8 ms | 177k words/s |
| 2,000 | 90,000 | 415.7 ms | 13.5 ms | 216k words/s |

Notes:

- Revert is effectively free because it re-inserts the original text nodes the
  walker stored; no re-parsing is involved.
- linkedom is slower than a real browser DOM, so browser numbers are expected to
  be better; treat this as a lower bound.
- The transform runs once per page plus once per dynamic mutation burst
  (coalesced through the `MutationObserver` into one `requestAnimationFrame`).
  A second pass over already-processed content is a near no-op because parents
  are marked and skipped.
- The loose CI budgets live in `tests/performance.test.ts` and only guard
  against pathological regressions, not absolute speed.
