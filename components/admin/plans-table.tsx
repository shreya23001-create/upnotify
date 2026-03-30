'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Plan } from '@/lib/types'

export function PlansTable({ plans }: { plans: Plan[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Monthly Price</TableHead>
          <TableHead>Monitors</TableHead>
          <TableHead>Interval</TableHead>
          <TableHead>API</TableHead>
          <TableHead>AI</TableHead>
          <TableHead>Visible</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">{plan.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">{plan.type}</Badge>
            </TableCell>
            <TableCell>
              {plan.price_monthly_gbp > 0
                ? `\u00A3${(plan.price_monthly_gbp / 100).toFixed(2)}`
                : plan.onboarding_fee_gbp > 0
                  ? `\u00A3${(plan.onboarding_fee_gbp / 100).toFixed(2)} one-time`
                  : 'Free'}
            </TableCell>
            <TableCell>{plan.monitor_limit ?? 'Unlimited'}</TableCell>
            <TableCell>{plan.check_interval_seconds}s</TableCell>
            <TableCell>{plan.has_api_access ? 'Yes' : 'No'}</TableCell>
            <TableCell>{plan.has_ai_predictive ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              <Badge variant={plan.is_visible ? 'default' : 'outline'}>
                {plan.is_visible ? 'Yes' : 'Hidden'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
