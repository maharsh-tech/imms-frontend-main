const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Locked',
  PUBLISHED: 'Published',
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-green-100 text-green-800',
};

type SubmissionStatusBadgeProps = {
  status: string;
};

const SubmissionStatusBadge = ({ status }: SubmissionStatusBadgeProps) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600'}`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default SubmissionStatusBadge;
