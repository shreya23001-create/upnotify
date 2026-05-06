-- Migration: backfill blog_posts.content rows that are plain strings
-- Root cause: calendar-blog-generator.ts was saving content as a bare markdown
-- string instead of { body: "..." }. The public blog page expects an object
-- with a `body` key, so every affected post returned 404.
--
-- This wraps all plain-string content rows into { "body": "<string>" }.
-- Safe to re-run: second run finds zero rows (all are now jsonb objects).

UPDATE blog_posts
SET content = jsonb_build_object('body', content #>> '{}')
WHERE jsonb_typeof(content) = 'string';
