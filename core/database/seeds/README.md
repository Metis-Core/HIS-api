# Diagnosis code catalogue

`icd10cm-2026-categories.tsv` is loaded into `diagnosis_codes` by `npm run db:seed:icd` (safe to re-run). The same command links diagnoses carried over from the old free-text `icd10Codes` field to their catalogue entry.

- **Source:** ICD-10-CM FY2026 order file (`icd10cm_order_2026.txt`, CMS "2026 Code Descriptions in Tabular Order", sha256 of the zip `55a9124a27ca78a4a5c41e1101eda064ec2e08d105ff9e78d1fbd1a83298ef11`). Source: CDC National Center for Health Statistics; the file is also available at no charge from cdc.gov and cms.gov.
- **Subset:** the 12,014 three- and four-character entries (categories such as `B54` and subcategories such as `B50.9`), which follow the WHO ICD-10 structure. The 5- to 7-character US-only extensions are left out. Titles are the official long descriptions, unchanged; only a dot is added after the third character.
- **System:** stored as `ICD-10-CM` so a later WHO ICD-10 or ICD-11 load (client Decision 2) can sit beside it under its own `system` value.
- **Licence:** ICD-10-CM is a US Government work in the public domain in the United States. ICD-10 itself is copyrighted by the World Health Organization, which authorised the US adaptation. Confirm that use outside the US is acceptable before go-live; ICD-11 is published by WHO under CC BY-ND 3.0 IGO.

Use of this material does not imply endorsement by CDC, NCHS, CMS, HHS or the United States Government.
