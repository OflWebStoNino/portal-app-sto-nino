import { Elysia } from 'elysia';
import { getPosts, getAllRequests, getHighlights, getDownloadableResources, getLatestAnnouncementAndNews, getUsers, getPriorityPostsAdmin } from '@/db/queries';
import { db } from '@/db';
import { userMiddleware } from '../auth';
import { bearer } from '@elysiajs/bearer'
import { requests, brgyPromotionCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const adminRoutes = new Elysia()
    .use(bearer())
    .derive(({ request }) => userMiddleware(request))
    .group('/api', app => app
        .get('/adminposts', async ({ user }) => {
            if (!user) {
                throw new Error('Unauthorized');
            }

            if (user.role !== 'admin') {
                throw new Error('Unauthorized');
            }

            const posts = await getPriorityPostsAdmin.execute();

            const priorityPosts = posts
                .filter((post) => post.priority)
                .map((post) => ({
                    postId: post.id,
                    priority: post.priority?.priority ?? 0,
                    post: {
                        title: post.title,
                    },
                }));

            return {
                posts: posts,
                priorityPosts: priorityPosts
            };
        }, {
            detail: {
                tags: ['Admin'],
                security: [{ BearerAuth: [] }],
                description: 'Get all posts with priority information. Admin access only.',
                responses: {
                    200: {
                        description: 'Posts retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        posts: { type: 'array', items: { type: 'object' } },
                                        priorityPosts: { type: 'array', items: { type: 'object' } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized - Not authenticated or not an admin' }
                }
            }
        })
        .get('/adminrequests', async ({ user, query }) => {
            if (!user) {
                throw new Error('Unauthorized');
            }

            if (user.role !== 'admin') {
                throw new Error('Unauthorized');
            }

            const page: number = parseInt(query.page || '1');

            const requests = await getAllRequests.execute({ limit: 10, offset: (page - 1) * 10 });

            return requests;
        }, {
            detail: {
                tags: ['Admin'],
                security: [{ BearerAuth: [] }],
                description: 'Get all requests with pagination. Admin access only.',
                query: {
                    page: { type: 'string', description: 'Page number for pagination' }
                },
                responses: {
                    200: { description: 'Requests retrieved successfully' },
                    401: { description: 'Unauthorized - Not authenticated or not an admin' }
                }
            }
        })
        .get('/highlights', async () => {
            const highlights = await getHighlights.execute();
            return highlights;
        }, {
            detail: {
                tags: ['Content'],
                description: 'Get highlighted content',
                responses: {
                    200: { description: 'Highlights retrieved successfully' }
                }
            }
        })
        .get('/downloadable-resources', async () => {
            const downloadableResources = await getDownloadableResources.execute();
            return downloadableResources;
        }, {
            detail: {
                tags: ['Resources'],
                description: 'Get list of downloadable resources',
                responses: {
                    200: { description: 'Resources retrieved successfully' }
                }
            }
        })
        .get('/marquee', async () => {
            const latestAnnouncementAndNews = await getLatestAnnouncementAndNews.execute();

            return {
                latestAnnouncementAndNews: {
                    rows: latestAnnouncementAndNews.rows
                }
            };
        }, {
            detail: {
                tags: ['Content'],
                description: 'Get latest announcements and news for marquee display',
                responses: {
                    200: {
                        description: 'Latest announcements and news retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        latestAnnouncementAndNews: {
                                            type: 'object',
                                            properties: {
                                                rows: { type: 'array', items: { type: 'object' } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        .post('/clean-expired-requests', async ({ bearer }) => {

            if (!bearer) {
                throw new Error('No bearer token');
            }

            if (bearer !== import.meta.env.CRON_KEY!) {
                throw new Error('Invalid bearer token');
            }

            return new Response('Expired requests cleaned successfully', {
                status: 200
            });
        }, {
            detail: {
                tags: ['Admin'],
                security: [{ BearerAuth: [] }],
                description: 'Clean expired requests',
                responses: {
                    200: { description: 'Expired requests cleaned successfully' }
                }
            }
        })
        .get('/admin/users', async ({ user, query }) => {
            if (!user) {
                throw new Error('Unauthorized');
            }

            if (user.role !== 'admin') {
                throw new Error('Unauthorized');
            }

            const pageNumber = parseInt(query.page || '1');

            const users = await getUsers.execute({ page: (pageNumber - 1) * 5, search: `%${query.searchUser || ''}%` });

            return users;
        }, {
            detail: {
                tags: ['Admin'],
                description: 'Get all users',
                responses: {
                    200: { description: 'Users retrieved successfully' }
                }
            }
        })
        .get('/promotion-categories', async ({ user }) => {
            if (!user || user.role !== 'admin') throw new Error('Unauthorized');
            const categories = await db.select().from(brgyPromotionCategories).orderBy(brgyPromotionCategories.createdAt);
            return { success: true, categories };
        })
        .post('/promotion-categories', async ({ user, body }) => {
            if (!user || user.role !== 'admin') throw new Error('Unauthorized');
            if (!body) throw new Error('No body provided');
            const { name } = body;
            if (!name) throw new Error('Name is required');
            const [category] = await db.insert(brgyPromotionCategories).values({ name }).returning();
            return { success: true, category };
        })
        .delete('/promotion-categories/:id', async ({ user, params }) => {
            if (!user || user.role !== 'admin') throw new Error('Unauthorized');
            const id = Number(params.id);
            if (!id) throw new Error('ID is required');
            const [deleted] = await db.delete(brgyPromotionCategories).where(eq(brgyPromotionCategories.id, id)).returning();
            if (!deleted) throw new Error('Category not found');
            return { success: true, id };
        })
    );