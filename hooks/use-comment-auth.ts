// hooks/use-comment-auth.ts
import { useSession } from "next-auth/react";
// import { UserRole } from "@prisma/client";

/**
 * Hook to check if the current user can modify (edit/delete) a comment or reply
 * 
 * @param ownerId The ID of the user who created the comment/reply
 * @returns An object with auth-related properties and methods
 */
export function useCommentAuth(ownerId?: string) {
  const { data: session, status } = useSession();
  
  // Check if user is authenticated
  const isAuthenticated = status === "authenticated";
  
  // Check if user is the owner of the content
  const isOwner = isAuthenticated && session?.user?.id === ownerId;
  
  // Check if user has Author or Admin role
  const isAuthorOrAdmin = isAuthenticated && (
    session?.user?.role === "AUTHOR" || 
    session?.user?.role === "ADMIN"
  );
  
  // Check if user has permission to modify the content
  const canModify = isOwner || isAuthorOrAdmin;

  return {
    isAuthenticated,
    isOwner,
    isAuthorOrAdmin,
    canModify,
    user: session?.user,
    status
  };
}