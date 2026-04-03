-- Keyword suggestions: admin-managed, preloaded library
-- Each suggestion has a category, type (positive/negative), and description for marketing

CREATE TABLE IF NOT EXISTS public.keyword_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,           -- 'checkout', 'contact', 'homepage', 'security', 'wordpress', 'ecommerce', 'api', 'login', 'general'
  type TEXT NOT NULL DEFAULT 'negative',  -- 'positive' or 'negative'
  url_pattern TEXT,                 -- regex or contains match for auto-suggesting (e.g., 'checkout|cart|payment')
  description TEXT,                 -- why this keyword matters (for marketing/help docs)
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.keyword_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (suggestions shown in monitor form)
CREATE POLICY "Authenticated users can read keyword suggestions"
  ON public.keyword_suggestions FOR SELECT TO authenticated
  USING (is_active = true);

-- Super admin manages
CREATE POLICY "Super admin manages keyword suggestions"
  ON public.keyword_suggestions FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role full access
CREATE POLICY "Service role manages keyword suggestions"
  ON public.keyword_suggestions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================================
-- SEED DATA: 150+ preloaded keyword suggestions
-- =============================================================

-- CHECKOUT / ECOMMERCE (positive)
INSERT INTO public.keyword_suggestions (keyword, category, type, url_pattern, description) VALUES
('Place Order', 'checkout', 'positive', 'checkout|cart|payment|order', 'Confirms checkout button is visible — if missing, customers cannot complete purchase'),
('Add to Cart', 'checkout', 'positive', 'product|shop|store|item', 'Confirms products can be added to cart — if missing, store is broken'),
('Secure Checkout', 'checkout', 'positive', 'checkout|payment', 'Confirms secure payment flow is available'),
('Proceed to Payment', 'checkout', 'positive', 'checkout|cart', 'Confirms payment step is reachable'),
('Buy Now', 'checkout', 'positive', 'product|shop|buy', 'Confirms purchase button is visible'),
('Shipping', 'checkout', 'positive', 'checkout|shipping|delivery', 'Confirms shipping options are displayed'),
('Order Summary', 'checkout', 'positive', 'checkout|order|confirmation', 'Confirms order summary renders correctly'),
('Apply Coupon', 'checkout', 'positive', 'checkout|cart|coupon', 'Confirms coupon/discount functionality works'),

-- CHECKOUT / ECOMMERCE (negative)
('out of stock', 'checkout', 'negative', 'product|shop|store', 'Detects unexpected out-of-stock status on product pages'),
('payment failed', 'checkout', 'negative', 'checkout|payment|order', 'Catches payment processing failures before customers report them'),
('cart is empty', 'checkout', 'negative', 'cart|checkout', 'Detects broken add-to-cart functionality'),
('unavailable', 'checkout', 'negative', 'product|shop', 'Catches products becoming unavailable unexpectedly'),
('sold out', 'checkout', 'negative', 'product|shop|store', 'Detects inventory issues you may not know about'),

-- CONTACT / FORMS (positive)
('Send Message', 'contact', 'positive', 'contact|form|enquir|message', 'Confirms contact form submit button is visible'),
('Submit', 'contact', 'positive', 'contact|form|apply|register', 'Confirms form submission is possible'),
('Thank you', 'contact', 'positive', 'thank|success|confirm', 'Confirms form submission success page loads'),
('Contact Us', 'contact', 'positive', 'contact|support|help', 'Confirms contact information is displayed'),

-- CONTACT / FORMS (negative)
('form error', 'contact', 'negative', 'contact|form', 'Catches broken form submissions'),
('could not send', 'contact', 'negative', 'contact|form|message', 'Catches email delivery failures on contact forms'),
('validation error', 'contact', 'negative', 'contact|form|register', 'Catches form validation breaking after updates'),

-- LOGIN / AUTH (positive)
('Sign In', 'login', 'positive', 'login|signin|auth', 'Confirms login page renders correctly'),
('Password', 'login', 'positive', 'login|signin|auth|password', 'Confirms password field is present'),
('Forgot Password', 'login', 'positive', 'login|signin|auth', 'Confirms password reset flow is accessible'),
('Create Account', 'login', 'positive', 'signup|register|join', 'Confirms registration form is available'),

-- LOGIN / AUTH (negative)
('maintenance mode', 'login', 'negative', 'login|signin|auth|admin', 'Detects when login is blocked by maintenance'),
('account locked', 'login', 'negative', 'login|signin', 'Catches unexpected account lockouts'),
('service unavailable', 'login', 'negative', 'login|signin|auth', 'Catches login service failures'),

-- HOMEPAGE / BRAND (positive)
('Welcome', 'homepage', 'positive', NULL, 'Confirms homepage loads with expected content'),
('Sign Up', 'homepage', 'positive', NULL, 'Confirms signup CTA is visible on homepage'),
('Learn More', 'homepage', 'positive', NULL, 'Confirms homepage CTAs are present'),

-- SECURITY / HACK DETECTION (negative)
('viagra', 'security', 'negative', NULL, 'Detects pharma hack — hidden spam injected by hackers'),
('cialis', 'security', 'negative', NULL, 'Detects pharma hack — common SEO spam injection'),
('casino', 'security', 'negative', NULL, 'Detects gambling spam injection'),
('poker', 'security', 'negative', NULL, 'Detects gambling spam injection'),
('free bitcoin', 'security', 'negative', NULL, 'Detects crypto spam injection'),
('make money fast', 'security', 'negative', NULL, 'Detects spam content injection'),
('hacked by', 'security', 'negative', NULL, 'Detects website defacement'),
('pwned', 'security', 'negative', NULL, 'Detects website defacement'),
('eval(', 'security', 'negative', NULL, 'Detects JavaScript injection in page source'),
('base64_decode', 'security', 'negative', NULL, 'Detects PHP malware injection visible in output'),
('document.write', 'security', 'negative', NULL, 'Detects suspicious JavaScript injection'),

-- WORDPRESS ERRORS (negative)
('fatal error', 'wordpress', 'negative', NULL, 'Catches PHP fatal errors — site shows error instead of content'),
('database error', 'wordpress', 'negative', NULL, 'Catches database connection failures'),
('Error establishing a database connection', 'wordpress', 'negative', NULL, 'The most common WordPress crash — catches it instantly'),
('There has been a critical error', 'wordpress', 'negative', NULL, 'WordPress 5.2+ critical error message — site is broken'),
('Briefly unavailable for scheduled maintenance', 'wordpress', 'negative', NULL, 'WordPress stuck in maintenance mode after failed update'),
('White Screen', 'wordpress', 'negative', NULL, 'Detects WordPress White Screen of Death'),
('Parse error', 'wordpress', 'negative', NULL, 'Catches PHP syntax errors after code changes'),
('500 Internal Server Error', 'wordpress', 'negative', NULL, 'Catches server-side crashes'),
('503 Service Unavailable', 'wordpress', 'negative', NULL, 'Catches server overload or maintenance'),
('502 Bad Gateway', 'wordpress', 'negative', NULL, 'Catches proxy/server communication failures'),
('504 Gateway Timeout', 'wordpress', 'negative', NULL, 'Catches timeout errors from slow servers'),
('not found', 'wordpress', 'negative', NULL, 'Catches pages returning 404 content while HTTP 200'),
('wp-login', 'wordpress', 'negative', NULL, 'Detects redirect to login — page requires auth unexpectedly'),
('Memory exhausted', 'wordpress', 'negative', NULL, 'Catches PHP memory limit errors'),
('Maximum execution time', 'wordpress', 'negative', NULL, 'Catches PHP timeout errors'),
('Allowed memory size', 'wordpress', 'negative', NULL, 'Catches PHP memory allocation failures'),

-- API / HEALTH CHECK (positive)
('ok', 'api', 'positive', 'api|health|status|ping', 'Confirms API health endpoint returns OK'),
('healthy', 'api', 'positive', 'health|status|readiness', 'Confirms service health check passes'),
('operational', 'api', 'positive', 'status|health', 'Confirms service is operational'),
('running', 'api', 'positive', 'health|status|info', 'Confirms application is running'),
('version', 'api', 'positive', 'health|status|info|version', 'Confirms API returns version info (not error page)'),

-- API / HEALTH CHECK (negative)
('error', 'api', 'negative', 'api|health|status', 'Catches API error responses'),
('down', 'api', 'negative', 'api|health|status', 'Catches service down status'),
('degraded', 'api', 'negative', 'api|health|status', 'Catches degraded service status'),
('timeout', 'api', 'negative', 'api|health', 'Catches timeout errors'),
('rate limit', 'api', 'negative', 'api', 'Catches rate limiting issues'),
('unauthorized', 'api', 'negative', 'api', 'Catches authentication failures'),
('forbidden', 'api', 'negative', 'api', 'Catches authorization failures'),

-- GENERAL / CATCH-ALL (negative)
('server error', 'general', 'negative', NULL, 'Catches generic server errors on any page'),
('access denied', 'general', 'negative', NULL, 'Catches unexpected access restrictions'),
('page not found', 'general', 'negative', NULL, 'Catches soft 404s (HTTP 200 but 404 content)'),
('something went wrong', 'general', 'negative', NULL, 'Catches generic error messages'),
('try again later', 'general', 'negative', NULL, 'Catches temporary failure messages'),
('under construction', 'general', 'negative', NULL, 'Catches unexpected under-construction pages'),
('coming soon', 'general', 'negative', NULL, 'Catches pages replaced with placeholder content'),
('undefined', 'general', 'negative', NULL, 'Catches JavaScript rendering errors showing raw code'),
('null', 'general', 'negative', NULL, 'Catches data rendering failures'),
('NaN', 'general', 'negative', NULL, 'Catches numeric rendering failures'),
('[object Object]', 'general', 'negative', NULL, 'Catches JavaScript object rendering failures'),

-- PRICING / SAAS (positive)
('Get Started', 'pricing', 'positive', 'pricing|plans|subscribe', 'Confirms pricing CTA is visible'),
('Free Trial', 'pricing', 'positive', 'pricing|plans|trial', 'Confirms trial offer is displayed'),
('Subscribe', 'pricing', 'positive', 'pricing|plans|subscribe', 'Confirms subscription flow is available'),
('per month', 'pricing', 'positive', 'pricing|plans', 'Confirms pricing information is displayed'),

-- PRICING / SAAS (negative)
('price increased', 'pricing', 'negative', 'pricing|plans', 'Detects unexpected pricing changes'),
('no longer available', 'pricing', 'negative', 'pricing|plans', 'Detects plans being removed');
