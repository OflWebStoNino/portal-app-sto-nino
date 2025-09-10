import { Elysia } from 'elysia';
import { getConfig, getRecentPosts, getPriorityPosts, getPostContent, GetAllNews, GetAllAnnouncements, getBrgyPrograms, getBrgyEvents } from '@/db/queries';
import type { TTLType } from '../types';
import { userMiddleware } from '../auth';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { brgyPromotion, brgyPromotionCategories } from '@/db/schema';

const isBusinessHours = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 8 && hours < 20;
};

const getTTL = (type: TTLType) => {
    const isWorkHours = isBusinessHours();

    switch (type) {
        case 'recent':
            return isWorkHours ? 300 : 1800;
        case 'priority':
            return isWorkHours ? 900 : 3600;
        case 'config':
            return isWorkHours ? 1800 : 7200;
        case 'post':
            return isWorkHours ? 3600 : 14400;
    }
};

export const feedRoutes = new Elysia()
    .derive(({ request }) => userMiddleware(request))
    .group('/api', app => app
        .get('/config', async () => {

            const config = await getConfig.execute();
            return config;
        })
        .get('/feed', async () => {

            const [recentPosts, priorityPosts] = await Promise.all([
                getRecentPosts.execute(),
                getPriorityPosts.execute()
            ]);


            return {
                recent: recentPosts ?? {},
                priority: priorityPosts ?? {}
            };
        })
        .get('/feed/news', async ({ query }) => {

            const page = query.page || '1';

            const totalPages = await db.$count(posts, and(eq(posts.type, 'news'), eq(posts.public, true)));

            const data = await GetAllNews.execute({
                page: ((parseInt(page as string) || 1) - 1) * 9,
            });
            return { data, totalPages: Math.ceil(totalPages / 9) };
        })
        .get('/feed/announcements', async ({ query }) => {

            const page = query.page || '1';

            const totalPages = await db.$count(posts, and(eq(posts.type, 'announcement'), eq(posts.public, true)));


            const data = await GetAllAnnouncements.execute({
                page: ((parseInt(page as string) || 1) - 1) * 9,
            });

            return { data, totalPages: Math.ceil(totalPages / 9) };

        })
        .get('/feed/post/:postId', async ({ params }) => {

            const post = await getPostContent.execute({ postId: params.postId as string });
            const response = { content: post?.content ?? null };

            return response;
        })
        .post('/feed/cache/invalidate', async ({ user }) => {
            if (!user) {
                throw new Error('Unauthorized');
            }

            if (user.role !== 'admin') {
                throw new Error('Unauthorized');
            }

            return { success: true, message: 'Cache invalidated successfully' };
        }, {
            detail: {
                tags: ['Cache Management'],
                security: [{ BearerAuth: [] }],
                description: 'Invalidate the feed cache. Requires authentication.'
            }
        })
        .get('/feed/officers', async () => {
            const officials = await db.query.brgyOfficials.findMany()
            const skOfficers = await db.query.brgyStaff.findMany()

            console.log('allOfficers', officials, skOfficers)

            return {
                officials: officials,
                skOfficers: skOfficers
            }
        })
        .get('/brgy-programs', async () => {
            const programs = await getBrgyPrograms.execute();
            return programs;
        })
        .get('/brgy-events', async () => {
            const events = await getBrgyEvents.execute();
            return events;
        })
        .get('/promotions', async () => {
            const promotions = await db
                .select({
                    id: brgyPromotion.id,
                    imageIdCarousel: brgyPromotion.imageIdCarousel,
                    category: brgyPromotion.category,
                    address: brgyPromotion.address,
                    description: brgyPromotion.description,
                    createdAt: brgyPromotion.createdAt,
                })
                .from(brgyPromotion)
            return { success: true, promotions };
        })
        .get('/promotions/:id', async ({ params }) => {
            const promotions = await db.query.brgyPromotion.findMany({
                where: (table, { eq }) => eq(table.category, params.id as 'Properties' | 'Resorts' | 'Churches' | 'Farms' | 'Nature')
            });
            return { success: true, promotions };
        })
    );