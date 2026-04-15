export const ROLES = {
  RESIDENT: "resident",
  OPERATOR: "operator",
  COLLECTOR: "collector",
  ADMIN: "admin",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Example access checker
export const roleHasAccess = (userRole: string, requiredRole: string): boolean => {
  return userRole === requiredRole;
};
