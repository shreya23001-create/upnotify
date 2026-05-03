-- Migration: populate status_page_url for all known public monitors
-- Column was added in 00089_pmb.sql; this migration fills in the known URLs.

UPDATE public_monitors SET status_page_url = 'https://status.claude.com/'          WHERE domain = 'anthropic.com';
UPDATE public_monitors SET status_page_url = 'https://status.character.ai/'         WHERE domain = 'character.ai';
UPDATE public_monitors SET status_page_url = 'https://status.openai.com/'           WHERE domain = 'chat.openai.com';
UPDATE public_monitors SET status_page_url = 'https://status.civitai.com/status/public' WHERE domain = 'civitai.com';
UPDATE public_monitors SET status_page_url = 'https://status.claude.com/'           WHERE domain = 'claude.ai';
UPDATE public_monitors SET status_page_url = 'https://status.cohere.com/'           WHERE domain = 'cohere.com';
UPDATE public_monitors SET status_page_url = 'https://status.copy.ai/'              WHERE domain = 'copy.ai';
UPDATE public_monitors SET status_page_url = 'https://status.elevenlabs.io/'        WHERE domain = 'elevenlabs.io';
UPDATE public_monitors SET status_page_url = 'https://aistudio.google.com/status'  WHERE domain = 'gemini.google.com';
UPDATE public_monitors SET status_page_url = 'https://status.x.ai/'                WHERE domain = 'grok.com';
UPDATE public_monitors SET status_page_url = 'https://groqstatus.com/'              WHERE domain = 'groq.com';
UPDATE public_monitors SET status_page_url = 'https://status.huggingface.co/'      WHERE domain = 'huggingface.co';
UPDATE public_monitors SET status_page_url = 'https://status.jasper.ai/'           WHERE domain = 'jasper.ai';
UPDATE public_monitors SET status_page_url = 'https://status.mistral.ai/'          WHERE domain = 'mistral.ai';
UPDATE public_monitors SET status_page_url = 'https://status.openai.com/'          WHERE domain = 'openai.com';
UPDATE public_monitors SET status_page_url = 'https://status.perplexity.com/'      WHERE domain = 'perplexity.ai';
UPDATE public_monitors SET status_page_url = 'https://status.poe.com/'             WHERE domain = 'poe.com';
UPDATE public_monitors SET status_page_url = 'https://status.runway.team/'         WHERE domain = 'runwayml.com';
UPDATE public_monitors SET status_page_url = 'https://status.together.ai/'         WHERE domain = 'together.ai';
UPDATE public_monitors SET status_page_url = 'https://status.writesonic.com/'      WHERE domain = 'writesonic.com';

UPDATE public_monitors SET status_page_url = 'https://status.autotrader.co.uk/'    WHERE domain = 'autotrader.co.uk';

UPDATE public_monitors SET status_page_url = 'https://status.bamboohr.com/'        WHERE domain = 'bamboohr.com';
UPDATE public_monitors SET status_page_url = 'https://status.deel.com/'            WHERE domain = 'deel.com';
UPDATE public_monitors SET status_page_url = 'https://status.docusign.com/'        WHERE domain = 'docusign.com';
UPDATE public_monitors SET status_page_url = 'https://status.freshworks.com/'      WHERE domain = 'freshworks.com';
UPDATE public_monitors SET status_page_url = 'https://gusto.statuspage.io/'        WHERE domain = 'gusto.com';
UPDATE public_monitors SET status_page_url = 'https://status.helpscout.com/'       WHERE domain = 'helpscout.com';
UPDATE public_monitors SET status_page_url = 'https://ocistatus.oraclecloud.com/#/' WHERE domain = 'oracle.com';
UPDATE public_monitors SET status_page_url = 'https://status.pipedrive.com/'       WHERE domain = 'pipedrive.com';
UPDATE public_monitors SET status_page_url = 'https://status.quickbooks.intuit.com/' WHERE domain = 'quickbooks.intuit.com';
UPDATE public_monitors SET status_page_url = 'http://status.rippling.com/'         WHERE domain = 'rippling.com';
UPDATE public_monitors SET status_page_url = 'https://status.sage.com/'            WHERE domain = 'sage.com';
UPDATE public_monitors SET status_page_url = 'https://status.me.sap.com/'          WHERE domain = 'sap.com';
UPDATE public_monitors SET status_page_url = 'https://status.xero.com/'            WHERE domain = 'xero.com';
UPDATE public_monitors SET status_page_url = 'https://zohostatus.com/'             WHERE domain = 'zoho.com';

UPDATE public_monitors SET status_page_url = 'https://status.cdnjs.com/'           WHERE domain = 'cdnjs.com';
UPDATE public_monitors SET status_page_url = 'https://www.cloudflarestatus.com/'   WHERE domain = 'cloudflare.com';
UPDATE public_monitors SET status_page_url = 'https://status.cloudinary.com/'      WHERE domain = 'cloudinary.com';
UPDATE public_monitors SET status_page_url = 'https://status.imperva.com/'         WHERE domain = 'imperva.com';
UPDATE public_monitors SET status_page_url = 'https://status.jsdelivr.com/'        WHERE domain = 'jsdelivr.com';
UPDATE public_monitors SET status_page_url = 'http://status.keycdn.com/'           WHERE domain = 'keycdn.com';
UPDATE public_monitors SET status_page_url = 'https://status.rootly.com/'          WHERE domain = 'maxcdn.com';

UPDATE public_monitors SET status_page_url = 'https://status.hosting.com/'         WHERE domain = 'a2hosting.com';
UPDATE public_monitors SET status_page_url = 'https://status.digitalocean.com/'    WHERE domain = 'digitalocean.com';
UPDATE public_monitors SET status_page_url = 'https://www.dreamhoststatus.com/'    WHERE domain = 'dreamhost.com';
UPDATE public_monitors SET status_page_url = 'https://status.flyio.net/'           WHERE domain = 'fly.io';
UPDATE public_monitors SET status_page_url = 'https://status.godaddy.com/'         WHERE domain = 'godaddy.com';
UPDATE public_monitors SET status_page_url = 'https://status.heroku.com/'          WHERE domain = 'heroku.com';
UPDATE public_monitors SET status_page_url = 'https://developer.apple.com/system-status/' WHERE domain = 'icloud.com';
UPDATE public_monitors SET status_page_url = 'https://status.liquidweb.com/'       WHERE domain = 'liquidweb.com';
UPDATE public_monitors SET status_page_url = 'https://www.namecheap.com/status-updates/' WHERE domain = 'namecheap.com';
UPDATE public_monitors SET status_page_url = 'https://www.netlifystatus.com/'      WHERE domain = 'netlify.com';
UPDATE public_monitors SET status_page_url = 'https://status.pantheon.io/'         WHERE domain = 'pantheon.io';
UPDATE public_monitors SET status_page_url = 'https://status.upsun.com/'           WHERE domain = 'platform.sh';
UPDATE public_monitors SET status_page_url = 'https://status.apps.rackspace.com/'  WHERE domain = 'rackspace.com';
UPDATE public_monitors SET status_page_url = 'https://status.render.com/'          WHERE domain = 'render.com';
UPDATE public_monitors SET status_page_url = 'https://www.vercel-status.com/'      WHERE domain = 'vercel.com';

UPDATE public_monitors SET status_page_url = 'https://www.contentfulstatus.com/'   WHERE domain = 'contentful.com';
UPDATE public_monitors SET status_page_url = 'https://ghoststatus.org/'            WHERE domain = 'ghost.org';
