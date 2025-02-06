"use client";

import { useState, useEffect } from "react";
import { RoleIndicator } from "@/components/auth/RoleIndicator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Role } from "@/lib/constants/roles";
import { formatDistance } from "date-fns";

interface RoleAudit {
  id: string;
  userId: string;
  oldRole: Role;
  newRole: Role;
  modifiedBy: string;
  reason: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
  };
  modifier: {
    name: string | null;
    email: string | null;
  };
}

export default function AuditPage() {
  const [audits, setAudits] = useState<RoleAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await fetch("/api/users/roles/audit");
        const data = await response.json();
        setAudits(data.audits);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Role Change Audit Log</h1>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Old Role</TableHead>
              <TableHead>New Role</TableHead>
              <TableHead>Modified By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell>
                  {audit.user.name || audit.user.email || "N/A"}
                </TableCell>
                <TableCell>
                  <RoleIndicator role={audit.oldRole} />
                </TableCell>
                <TableCell>
                  <RoleIndicator role={audit.newRole} />
                </TableCell>
                <TableCell>
                  {audit.modifier.name || audit.modifier.email || "N/A"}
                </TableCell>
                <TableCell>{audit.reason || "No reason provided"}</TableCell>
                <TableCell>
                  {formatDistance(new Date(audit.createdAt), new Date(), { 
                    addSuffix: true 
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}