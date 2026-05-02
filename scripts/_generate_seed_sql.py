"""
Generate SQL INSERT statements from keyword-research/Content_Calendar.csv
for the content_calendar table.

Run:
  python scripts/_generate_seed_sql.py

Output:
  scripts/00085_seed_content_calendar.sql

Idempotent — uses ON CONFLICT (url_path) DO NOTHING.
"""
import csv
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(os.path.dirname(REPO_ROOT), 'keyword-research', 'Content_Calendar.csv')
OUT_PATH = os.path.join(REPO_ROOT, 'supabase', 'migrations', '00086_seed_content_calendar.sql')

VALID_POST_TYPES = {'hub_foundational', 'troubleshooting', 'informational', 'commercial', 'combined_intent'}
VALID_AUTHORS = {'Aradhna', 'Sachin', 'Steve', 'Krithi'}


def sql_escape(s: str) -> str:
    """Escape a string for SQL — wrap in single quotes, double single quotes inside."""
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"


def sql_text_array(items: list) -> str:
    """Format a Postgres text[] literal."""
    if not items:
        return "ARRAY[]::text[]"
    escaped = [sql_escape(i) for i in items]
    return "ARRAY[" + ", ".join(escaped) + "]::text[]"


def sql_int_or_null(s: str) -> str:
    if not s or s.strip() == '':
        return 'NULL'
    try:
        return str(int(s))
    except ValueError:
        return 'NULL'


def normalise_post_type(raw: str) -> str:
    return raw.strip().replace('-', '_')


def main():
    rows_to_insert = []
    skipped = []

    with open(CSV_PATH, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            post_type = normalise_post_type(row['post_type'])

            # Skip wiki rows — they go to aivisibility-app, not engineering-app
            if post_type in ('wiki_term', 'wiki_pillar'):
                skipped.append((row['url'], 'wiki'))
                continue

            if post_type not in VALID_POST_TYPES:
                skipped.append((row['url'], f'invalid post_type: {row["post_type"]}'))
                continue

            if row['author'] not in VALID_AUTHORS:
                skipped.append((row['url'], f'invalid author: {row["author"]}'))
                continue

            secondary = [s.strip() for s in row['secondary_keywords'].split(';') if s.strip()]

            rows_to_insert.append({
                'publish_date': row['publish_date'],
                'post_type': post_type,
                'hub': row['hub'] if row['hub'] else None,
                'primary_keyword': row['primary_keyword'],
                'secondary_keywords': secondary,
                'search_volume': row['search_volume'],
                'kd': row['kd'],
                'url_path': row['url'],
                'title_draft': row['title_draft'],
                'author': row['author'],
                'brand_prefix_required': row['brand_prefix_required'].upper() == 'YES',
            })

    # Write SQL
    out_lines = []
    out_lines.append("-- =============================================================================")
    out_lines.append("-- Seed: content_calendar — 168-page content plan")
    out_lines.append("-- Generated from keyword-research/Content_Calendar.csv")
    out_lines.append(f"-- Total valid rows: {len(rows_to_insert)} (skipped {len(skipped)} — wiki + invalid)")
    out_lines.append("-- Idempotent: uses ON CONFLICT (url_path) DO NOTHING.")
    out_lines.append("-- Run AFTER migration 00085 has been applied.")
    out_lines.append("-- =============================================================================")
    out_lines.append("")
    out_lines.append("INSERT INTO content_calendar (")
    out_lines.append("  publish_date, post_type, hub, primary_keyword, secondary_keywords,")
    out_lines.append("  search_volume, kd, url_path, title_draft, author, brand_prefix_required")
    out_lines.append(") VALUES")

    value_lines = []
    for r in rows_to_insert:
        value_lines.append(
            f"  ('{r['publish_date']}', '{r['post_type']}', "
            f"{sql_escape(r['hub']) if r['hub'] else 'NULL'}, "
            f"{sql_escape(r['primary_keyword'])}, "
            f"{sql_text_array(r['secondary_keywords'])}, "
            f"{sql_int_or_null(r['search_volume'])}, "
            f"{sql_int_or_null(r['kd'])}, "
            f"{sql_escape(r['url_path'])}, "
            f"{sql_escape(r['title_draft'])}, "
            f"'{r['author']}', "
            f"{str(r['brand_prefix_required']).lower()})"
        )

    out_lines.append(",\n".join(value_lines))
    out_lines.append("ON CONFLICT (url_path) DO NOTHING;")
    out_lines.append("")
    out_lines.append("-- Verify:")
    out_lines.append("--   SELECT post_type, count(*) FROM content_calendar GROUP BY post_type ORDER BY count(*) DESC;")
    out_lines.append("--   SELECT count(*) FROM content_calendar;  -- should equal " + str(len(rows_to_insert)))

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write("\n".join(out_lines))

    print(f"Wrote {len(rows_to_insert)} INSERT values to {OUT_PATH}")
    print(f"Skipped {len(skipped)} rows ({sum(1 for _, r in skipped if r == 'wiki')} wiki + {sum(1 for _, r in skipped if r != 'wiki')} invalid)")


if __name__ == '__main__':
    main()
