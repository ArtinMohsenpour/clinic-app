import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Public staff listing data for Staff page
export const getStaffPageData = unstable_cache(
    async () => {
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                // Show only users that are assigned to at least one branch (staff)
                branches: { some: {} },
            },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                image: true,
                email: true, // Contact info
                phone: true, // Contact info
                profile: { select: { avatarThumbUrl: true } },
                specialty: { select: { name: true } },
                // Fetch roles to display if specialty is missing
                roles: {
                    select: {
                        role: {
                            select: {
                                // Modified: removed 'displayName' as it's not in the schema, using 'name'
                                name: true,
                            },
                        },
                    },
                },
                // Primary assignment (if any)
                branches: {
                    where: { isPrimary: true },
                    select: {
                        isPrimary: true,
                        positionTitle: true,
                        branch: { select: { id: true, name: true, key: true, city: true } },
                        department: { select: { id: true, name: true, key: true } },
                    },
                },
            },
        });

        // If a user has no primary, fetch first assignment as fallback
        // Note: Keep server-side to avoid extra client work
        const withFallback = await Promise.all(
            users.map(async (u) => {
                if (u.branches.length > 0) return u;
                const first = await prisma.userBranch.findFirst({
                    where: { userId: u.id },
                    orderBy: { assignedAt: "asc" },
                    select: {
                        isPrimary: true,
                        positionTitle: true,
                        branch: { select: { id: true, name: true, key: true, city: true } },
                        department: { select: { id: true, name: true, key: true } },
                    },
                });
                // Ensure consistent return type structure
                return { ...u, branches: first ? [first] : [] };
            })
        );

        return withFallback;
    },
    ["staff-page-data"],
    { tags: ["staff"] }
);