import React from "react";

interface AdminSyncBarProps {
  compact?: boolean;
  floating?: boolean;
}

// Visual sync bar was permanently removed per user request in favor of seamless background auto-saving to Firestore
export const AdminSyncBar: React.FC<AdminSyncBarProps> = () => {
  return null;
};
