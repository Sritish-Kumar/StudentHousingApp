"use client";

export default function StatusBadge({ status }) {
  const statusConfig = {
    verified: {
      label: "Verified",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    suspended: {
      label: "Suspended",
      className: "bg-gray-100 text-gray-800 border-gray-200",
    },
    active: {
      label: "Active",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
