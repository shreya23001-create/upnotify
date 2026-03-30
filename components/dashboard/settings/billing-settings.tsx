'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Subscription, Invoice } from '@/lib/types'

export function BillingSettings({
  subscription,
  invoices,
}: {
  subscription: Subscription | null
  invoices: Invoice[]
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                  {subscription.status}
                </Badge>
                <span className="text-sm capitalize">{subscription.billing_cycle}</span>
              </div>
              {subscription.current_period_end && (
                <p className="text-sm text-zinc-500">
                  Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No active subscription.</p>
          )}
          <Button className="mt-4" disabled>
            Manage Subscription
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-zinc-500">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">
                      {'\u00A3'}{(invoice.amount_gbp / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                    {invoice.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
