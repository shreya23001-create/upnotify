import Link from 'next/link'

interface AddMonitorButtonProps {
  size?: 'sm' | 'default'
  /** True when the org has no free purchased slot AND no domain already
   *  claimed — every target on the Create Monitor page would just be
   *  blocked on submit, so disable it upfront with an explanatory tooltip
   *  instead of letting the user fill out the whole form first. */
  disabled?: boolean
}

export function AddMonitorButton({ size = 'default', disabled = false }: AddMonitorButtonProps): React.ReactElement {
  const btnClass = size === 'sm' ? 'btn btn-primary btn-sm' : 'btn btn-primary'

  if (disabled) {
    return (
      <Link
        href="/dashboard/plans"
        className={`${btnClass} add-monitor-btn-locked`}
        title="You've used all your purchased website slots — buy more to add another website."
      >
        + Add Monitor
      </Link>
    )
  }

  return (
    <Link href="/dashboard/monitors/new/manual" className={btnClass}>
      + Add Monitor
    </Link>
  )
}
