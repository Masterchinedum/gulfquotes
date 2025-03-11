import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import type { UserResponse, UserProfileIncludeParams } from "@/types/api/users";

export async function GET(
  req: Request
): Promise<NextResponse<UserResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Extract slug from URL
    const slug = req.url.split('/users/')[1]?.split('/')[0];
    if (!slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid user slug" } },
        { status: 400 }
      );
    }

    // Parse query params to determine what relationships to include
    const url = new URL(req.url);
    const includeParams: UserProfileIncludeParams = {
      likes: url.searchParams.get("includeLikes") === "true",
      bookmarks: url.searchParams.get("includeBookmarks") === "true",
      comments: url.searchParams.get("includeComments") === "true",
      followedAuthors: url.searchParams.get("includeFollowedAuthors") === "true",
    };

    // Find user by different identifiers in order of priority
    const user = await db.user.findFirst({
      where: {
        OR: [
          { userProfile: { slug: slug } },
          { userProfile: { username: slug } },
          { id: slug }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        userProfile: {
          select: {
            username: true,
            bio: true,
            slug: true,
            createdAt: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Check if the current user is the profile owner for privacy checks
    const isOwner = session.user.id === user.id;
    
    // Build the response with basic user data
    const userData = {
      id: user.id,
      name: user.name,
      email: isOwner ? user.email : null, // Only show email to the owner
      image: user.image,
      role: user.role,
      userProfile: user.userProfile ? {
        username: user.userProfile.username,
        bio: user.userProfile.bio,
        slug: user.userProfile.slug,
      } : null,
      isCurrentUser: isOwner,
    };

    // Fetch additional relationships based on query params and privacy settings
    if (user.userProfile) {
      // Activity statistics - always include these
      const [quoteLikeCount, quoteBookmarkCount, commentCount, followingCount] = await Promise.all([
        db.quoteLike.count({ where: { userId: user.id } }),
        db.quoteBookmark.count({ where: { userId: user.id } }),
        db.comment.count({ where: { userId: user.id } }),
        db.authorFollow.count({ where: { userId: user.id } }),
      ]);

      // Add activity stats to the response
      userData.userProfile.activityStats = {
        likeCount: quoteLikeCount,
        bookmarkCount: quoteBookmarkCount,
        commentCount: commentCount,
        followingCount: followingCount,
        quoteCount: 0, // Regular users don't have quotes
        memberSince: user.userProfile.createdAt.toISOString(),
      };

      // Default privacy settings - in a real app, these would come from userProfile
      const privacySettings = {
        showLikes: true, 
        showBookmarks: isOwner, // Only owner can see bookmarks by default
        showFollowing: true,
      };
      
      userData.userProfile.privacySettings = privacySettings;

      // Fetch liked quotes if requested and permitted
      if (includeParams.likes && privacySettings.showLikes) {
        const likes = await db.quoteLike.findMany({
          where: { userId: user.id },
          select: {
            quote: {
              select: {
                id: true,
                content: true,
                slug: true,
                backgroundImage: true,
                createdAt: true,
                category: {
                  select: { 
                    name: true,
                    slug: true 
                  }
                },
                authorProfile: {
                  select: {
                    name: true,
                    slug: true,
                    images: {
                      take: 1,
                      select: { url: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Limit to avoid large payloads
        });

        // Transform to match expected format
        userData.userProfile.likes = likes.map(like => ({
          id: like.quote.id,
          content: like.quote.content,
          slug: like.quote.slug,
          backgroundImage: like.quote.backgroundImage,
          createdAt: like.quote.createdAt.toISOString(),
          category: {
            name: like.quote.category.name,
            slug: like.quote.category.slug
          },
          authorProfile: {
            name: like.quote.authorProfile.name,
            slug: like.quote.authorProfile.slug,
            image: like.quote.authorProfile.images[0]?.url || null
          }
        }));
      }

      // Fetch bookmarks if requested and permitted (only for owner)
      if (includeParams.bookmarks && privacySettings.showBookmarks && isOwner) {
        const bookmarks = await db.quoteBookmark.findMany({
          where: { userId: user.id },
          select: {
            quote: {
              select: {
                id: true,
                content: true,
                slug: true,
                backgroundImage: true,
                createdAt: true,
                category: {
                  select: { 
                    name: true,
                    slug: true 
                  }
                },
                authorProfile: {
                  select: {
                    name: true,
                    slug: true,
                    images: {
                      take: 1,
                      select: { url: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        userData.userProfile.bookmarks = bookmarks.map(bookmark => ({
          id: bookmark.quote.id,
          content: bookmark.quote.content,
          slug: bookmark.quote.slug,
          backgroundImage: bookmark.quote.backgroundImage,
          createdAt: bookmark.quote.createdAt.toISOString(),
          category: {
            name: bookmark.quote.category.name,
            slug: bookmark.quote.category.slug
          },
          authorProfile: {
            name: bookmark.quote.authorProfile.name,
            slug: bookmark.quote.authorProfile.slug,
            image: bookmark.quote.authorProfile.images[0]?.url || null
          }
        }));
      }

      // Fetch comments if requested
      if (includeParams.comments) {
        const comments = await db.comment.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            content: true,
            createdAt: true,
            quote: {
              select: {
                id: true,
                content: true,
                slug: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        userData.userProfile.comments = comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          quote: {
            id: comment.quote.id,
            content: comment.quote.content,
            slug: comment.quote.slug
          }
        }));
      }

      // Fetch followed authors if requested and permitted
      if (includeParams.followedAuthors && privacySettings.showFollowing) {
        const following = await db.authorFollow.findMany({
          where: { userId: user.id },
          select: {
            authorProfile: {
              select: {
                id: true,
                name: true,
                slug: true,
                bio: true,
                createdAt: true,
                images: {
                  take: 1,
                  select: { url: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        userData.userProfile.followedAuthors = following.map(follow => ({
          id: follow.authorProfile.id,
          name: follow.authorProfile.name,
          slug: follow.authorProfile.slug,
          bio: follow.authorProfile.bio,
          image: follow.authorProfile.images[0]?.url || null,
          createdAt: follow.authorProfile.createdAt.toISOString()
        }));
      }
    }

    return NextResponse.json({ data: userData });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}