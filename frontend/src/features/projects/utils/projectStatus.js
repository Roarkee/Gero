/**
 * Returns display config for a project's status.
 * Accounts for archived flag and the backend status choices:
 *   active | inactive | completed | cancelled
 * Also maps health/at_risk info when available via insight.
 */
export function getStatusConfig(project) {
  if (!project) return { label: "Unknown", color: "gray", dotColor: "bg-gray-400", badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };

  if (project.archived) {
    return {
      label: "Archived",
      color: "gray",
      dotColor: "bg-gray-400",
      badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };
  }

  switch (project.status) {
    case "active":
      return {
        label: "Active",
        color: "green",
        dotColor: "bg-green-500",
        badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      };
    case "inactive":
      return {
        label: "Inactive",
        color: "gray",
        dotColor: "bg-gray-400",
        badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      };
    case "completed":
      return {
        label: "Completed",
        color: "blue",
        dotColor: "bg-blue-500",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "red",
        dotColor: "bg-red-400",
        badgeClass: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      };
    default:
      return {
        label: project.status ?? "Unknown",
        color: "gray",
        dotColor: "bg-gray-400",
        badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
