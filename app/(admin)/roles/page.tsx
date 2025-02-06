"use client";

import { useCallback, useState } from "react";
import { RoleIndicator } from "@/components/auth/RoleIndicator";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Role } from "@/lib/constants/roles";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
}

export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/roles");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = async (userId: string, newRole: Role) => {
    try {
      const response = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Role updated successfully");
      fetchUsers(); // Refresh user list
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <Button onClick={() => router.refresh()}>Refresh</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <RoleIndicator role={user.role} />
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: Role) => 
                      updateUserRole(user.id, newRole)
                    }
                  >
                    <option value="ADMINISTRATOR">Administrator</option>
                    <option value="AUTHOR">Author</option>
                    <option value="USER">User</option>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}