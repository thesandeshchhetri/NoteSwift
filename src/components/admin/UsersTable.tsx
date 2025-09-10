'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import type { UserWithNoteCount } from "@/app/admin/page";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { setUserRole } from "@/ai/flows/set-user-role";
  

interface UsersTableProps {
  users: UserWithNoteCount[];
  loading: boolean;
}

export function UsersTable({ users, loading }: UsersTableProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleViewNotes = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'user') => {
    setIsUpdating(uid);
    try {
        await setUserRole({ uid, role: newRole });
        toast({ title: 'Success', description: 'User role updated.' });
    } catch (error: any) {
        console.error("Failed to set user role:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update user role.' });
    } finally {
        setIsUpdating(null);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'superadmin') return -1;
    if (b.role === 'superadmin') return 1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return (b.noteCount) - (a.noteCount);
  });

  return (
    <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Note Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : sortedUsers.length > 0 ? (
                sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {currentUser?.role === 'superadmin' && user.role !== 'superadmin' ? (
                        <Select
                            value={user.role || 'user'}
                            onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'user')}
                            disabled={isUpdating === user.id}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <span className={`px-2 py-1 text-xs font-medium capitalize rounded-full ${
                            user.role === 'superadmin' ? 'bg-primary/20 text-primary' 
                            : user.role === 'admin' ? 'bg-amber-500/20 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                            {user.role || 'user'}
                        </span>
                    )}
                  </TableCell>
                  <TableCell>{user.noteCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewNotes(user.id)}>
                      View Notes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
  );
}
