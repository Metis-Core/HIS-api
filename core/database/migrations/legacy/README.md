# Legacy migrations (not executed)

These files predate the Sprint 1 baseline. They never formed a runnable chain (`RenameVisitTriageFk` fails on an empty database) because the schema was managed with `synchronize: true`. They are kept for reference only and are excluded from the migration glob and the build. `1792266266332-Baseline.ts` reproduces the schema at commit `fb74fbc` exactly.
