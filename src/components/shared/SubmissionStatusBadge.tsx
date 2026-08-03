const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Locked',
  PUBLISHED: 'Published',
}

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'bg-surface-container text-on-surface-variant',
  SUBMITTED: 'bg-secondary-container text-on-secondary-container',
  PUBLISHED: 'bg-primary-fixed/50 text-on-primary-fixed',
}

type SubmissionStatusBadgeProps = {
  status: string
}

const SubmissionStatusBadge = ({ status }: SubmissionStatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded px-2 py-0.5 text-label-sm font-semibold ${
      STATUS_CLASSES[status] ?? 'bg-surface-container text-on-surface-variant'
    }`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
)

export default SubmissionStatusBadge
