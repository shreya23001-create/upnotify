'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ConnectInstructionsProps {
  hasApiKey: boolean
  apiKeyPrefix: string | null
}

type Platform = 'woocommerce' | 'shopify' | 'bigcommerce' | 'manual'

export function ConnectInstructions({
  hasApiKey,
  apiKeyPrefix,
}: ConnectInstructionsProps): React.ReactElement {
  const [activePlatform, setActivePlatform] = useState<Platform>('woocommerce')

  const webhookUrl = 'https://uptrue.io/api/v1/compete/webhook'
  const webhookUrlWithKey = apiKeyPrefix
    ? `${webhookUrl}?key=YOUR_API_KEY`
    : webhookUrl

  return (
    <div className="compete-connect-section">
      {/* API key status */}
      <div className="card compete-connect-card">
        <h3 className="compete-connect-heading">Your Webhook Endpoint</h3>
        <div className="compete-webhook-url-box">
          <code className="compete-webhook-url">{webhookUrlWithKey}</code>
        </div>
        {!hasApiKey && (
          <div className="compete-connect-warning">
            <strong>API key required.</strong> You need an API key to authenticate webhook requests.{' '}
            <Link href="/dashboard/settings" className="compete-link">
              Generate one in Settings
            </Link>
          </div>
        )}
        {hasApiKey && (
          <p className="compete-connect-note">
            Your API key starts with <code>{apiKeyPrefix}...</code>. Use the full key in the webhook URL or as a Bearer token.
          </p>
        )}
      </div>

      {/* Platform tabs */}
      <div className="compete-platform-tabs">
        <button
          className={`compete-platform-tab ${activePlatform === 'woocommerce' ? 'active' : ''}`}
          onClick={() => setActivePlatform('woocommerce')}
        >
          WooCommerce
        </button>
        <button
          className={`compete-platform-tab ${activePlatform === 'shopify' ? 'active' : ''}`}
          onClick={() => setActivePlatform('shopify')}
        >
          Shopify
        </button>
        <button
          className={`compete-platform-tab ${activePlatform === 'bigcommerce' ? 'active' : ''}`}
          onClick={() => setActivePlatform('bigcommerce')}
        >
          BigCommerce
        </button>
        <button
          className={`compete-platform-tab ${activePlatform === 'manual' ? 'active' : ''}`}
          onClick={() => setActivePlatform('manual')}
        >
          Manual / API
        </button>
      </div>

      {/* Platform instructions */}
      <div className="card compete-connect-card">
        {activePlatform === 'woocommerce' && (
          <div className="compete-instructions">
            <h3 className="compete-connect-heading">WordPress / WooCommerce</h3>
            <ol className="compete-steps">
              <li>
                <strong>Install a webhook plugin</strong> such as{' '}
                <em>WP Webhooks</em> or <em>WooCommerce Webhooks</em> (built-in under WooCommerce &gt; Settings &gt; Advanced &gt; Webhooks).
              </li>
              <li>
                <strong>Create a new webhook</strong> with these settings:
                <ul className="compete-substeps">
                  <li>Name: <code>Uptrue Price Sync</code></li>
                  <li>Status: <code>Active</code></li>
                  <li>Topic: <code>Product updated</code></li>
                  <li>Delivery URL: <code>{webhookUrlWithKey}</code></li>
                  <li>Secret: Leave empty (authentication via API key)</li>
                </ul>
              </li>
              <li>
                <strong>Ensure the payload</strong> includes: <code>productUrl</code>, <code>price</code>, <code>currency</code>, and optionally <code>stockStatus</code>.
              </li>
              <li>
                <strong>Test the webhook</strong> by updating a product price in WooCommerce and checking the Compete dashboard.
              </li>
            </ol>
            <div className="compete-payload-example">
              <h4>Expected Payload</h4>
              <pre className="compete-code-block">{`{
  "productUrl": "https://yourstore.com/product/blue-widget",
  "price": 29.99,
  "currency": "GBP",
  "stockStatus": "in_stock"
}`}</pre>
            </div>
          </div>
        )}

        {activePlatform === 'shopify' && (
          <div className="compete-instructions">
            <h3 className="compete-connect-heading">Shopify</h3>
            <ol className="compete-steps">
              <li>
                <strong>Go to Settings &gt; Notifications</strong> in your Shopify admin.
              </li>
              <li>
                <strong>Scroll to Webhooks</strong> and click <em>Create webhook</em>.
              </li>
              <li>
                <strong>Configure:</strong>
                <ul className="compete-substeps">
                  <li>Event: <code>Product update</code></li>
                  <li>Format: <code>JSON</code></li>
                  <li>URL: <code>{webhookUrlWithKey}</code></li>
                </ul>
              </li>
              <li>
                <strong>Alternatively, use Shopify Flow</strong> to transform the payload. Create a Flow that triggers on &quot;Product variant price changed&quot; and sends an HTTP request with the expected payload format.
              </li>
              <li>
                <strong>Test</strong> by updating a product price and checking Compete.
              </li>
            </ol>
            <div className="compete-payload-example">
              <h4>Expected Payload</h4>
              <pre className="compete-code-block">{`{
  "productUrl": "https://yourstore.myshopify.com/products/blue-widget",
  "price": 29.99,
  "currency": "GBP",
  "stockStatus": "in_stock"
}`}</pre>
            </div>
          </div>
        )}

        {activePlatform === 'bigcommerce' && (
          <div className="compete-instructions">
            <h3 className="compete-connect-heading">BigCommerce</h3>
            <ol className="compete-steps">
              <li>
                <strong>Go to Settings &gt; API &gt; Webhooks</strong> in your BigCommerce admin.
              </li>
              <li>
                <strong>Create a webhook:</strong>
                <ul className="compete-substeps">
                  <li>Scope: <code>store/product/updated</code></li>
                  <li>Destination: <code>{webhookUrlWithKey}</code></li>
                  <li>Active: <code>Yes</code></li>
                </ul>
              </li>
              <li>
                <strong>Transform the payload</strong> using a middleware function or serverless function to match the expected format below.
              </li>
              <li>
                <strong>Test</strong> by updating a product in BigCommerce.
              </li>
            </ol>
            <div className="compete-payload-example">
              <h4>Expected Payload</h4>
              <pre className="compete-code-block">{`{
  "productUrl": "https://yourstore.mybigcommerce.com/blue-widget",
  "price": 29.99,
  "currency": "GBP",
  "stockStatus": "in_stock"
}`}</pre>
            </div>
          </div>
        )}

        {activePlatform === 'manual' && (
          <div className="compete-instructions">
            <h3 className="compete-connect-heading">Manual / Direct API</h3>
            <p className="compete-instructions-text">
              You can also send price data directly from any system using our REST API.
              No plugin required.
            </p>
            <div className="compete-payload-example">
              <h4>API Request</h4>
              <pre className="compete-code-block">{`POST ${webhookUrl}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "productUrl": "https://example.com/product/blue-widget",
  "price": 29.99,
  "currency": "GBP",
  "stockStatus": "in_stock"
}`}</pre>
            </div>
            <div className="compete-payload-example">
              <h4>Or use query parameter authentication</h4>
              <pre className="compete-code-block">{`POST ${webhookUrl}?key=YOUR_API_KEY
Content-Type: application/json

{
  "productUrl": "https://example.com/product/blue-widget",
  "price": 29.99,
  "currency": "GBP",
  "stockStatus": "in_stock"
}`}</pre>
            </div>
            <p className="compete-instructions-text">
              You can also add product URLs in the Compete dashboard and we will auto-extract prices
              using our built-in scraper (JSON-LD, Open Graph, Microdata, or custom CSS selector).
            </p>
          </div>
        )}
      </div>

      {/* Supported stock status values */}
      <div className="card compete-connect-card">
        <h3 className="compete-connect-heading">Stock Status Values</h3>
        <div className="compete-table-wrapper">
          <table className="compete-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>in_stock</code></td>
                <td>Product is available and in stock</td>
              </tr>
              <tr>
                <td><code>out_of_stock</code></td>
                <td>Product is currently unavailable</td>
              </tr>
              <tr>
                <td><code>low_stock</code></td>
                <td>Product has limited availability</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
