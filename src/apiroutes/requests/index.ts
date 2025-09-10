import { Elysia } from 'elysia';
import { getRequests, getRequest, getRequestLogs, getUserFamily, getUserDetails } from '@/db/queries';
import { utapi } from '@/utconfig/uploadthing';
import _ from 'lodash';
import { userMiddleware } from '../auth';
import { db } from '@/db';

export const requestRoutes = new Elysia()
    .derive(({ request }) => userMiddleware(request))
    .group('/api', app => app
        .get('/requests', async ({ user, query }) => {
            if (!user) {
                throw new Error('Unauthorized');
            }

            const page = parseInt(query.page ?? '1');

            const requests = await getRequests.execute({ userId: user.id, limit: 10, offset: (page - 1) * 10 });

            return requests;
        }, {
            detail: {
                tags: ['Requests'],
                security: [{ BearerAuth: [] }],
                description: 'Get all requests for the authenticated user',
                responses: {
                    200: {
                        description: 'List of user requests retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            status: { type: 'string' },
                                            userId: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized - User not authenticated' }
                }
            }
        })
        .get('/request/:requestId', async ({ params, user }) => {
            if (!params.requestId) {
                throw new Error('Request ID is required');
            }

            if (!user) {
                throw new Error('Unauthorized');
            }

            const request = await getRequest.execute({ requestId: params.requestId as string })

            if (user.role !== 'admin') {
                if (request?.userId !== user.id) {
                    throw new Error('Unauthorized');
                }
            }

            if (!request) {
                throw new Error('Request not found');
            }

            const pictureUrl = await utapi.getSignedURL(request.idPicture, {
                expiresIn: 60 * 60
            })

            const response = {
                request: {
                    ..._.omit(request, ['idPicture', 'status']),
                    idPicture: pictureUrl
                }
            };



            return {
                request: {
                    ...response.request,
                    status: request.status
                }
            };
        })
        .get('/requestlogs/:requestId', async ({ params, user }) => {
            if (!params.requestId) {
                throw new Error('Request ID is required');
            }

            if (!user) {
                throw new Error('Unauthorized');
            }

            const requestLogs = await getRequestLogs.execute({ requestId: params.requestId as string })
            return { requestLogs };
        }, {
            detail: {
                tags: ['Requests'],
                security: [{ BearerAuth: [] }],
                description: 'Get logs for a specific request',
                params: {
                    requestId: { type: 'string', description: 'ID of the request to get logs for' }
                },
                responses: {
                    200: {
                        description: 'Request logs retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        requestLogs: { type: 'array', items: { type: 'object' } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Request not found' }
                }
            }
        })
        .get("/initialconfig", async ({ user }) => {
            if (user) {

                const userDetails = await getUserFamily.execute({ userId: user.id });

                return {
                    hasInitialDetails: userDetails ? true : false
                }

            }

            return {
                hasInitialDetails: false
            }
        }, {
            detail: {
                tags: ['User Configuration'],
                description: 'Get user initial configuration status',
                responses: {
                    200: {
                        description: 'Initial configuration status retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        hasInitialDetails: { type: 'boolean' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        .get("/initialconfig/user", async ({ user }) => {
            if (!user) {
                throw new Error('Unauthorized');
            }

            const userDetails = await getUserDetails.execute({ userId: user.id });

            console.log(userDetails);

            return {
                userDetails
            }
        })
        .get("/chatrequests/:requestUpdateId", async ({ params, user }) => {
            if (!params.requestUpdateId) {
                throw new Error('Request ID is required');
            }
            if (!user) {
                throw new Error('Unauthorized');
            }
            const chat = await db.query.requestUpdates.findFirst({
                where: (table, { eq }) => eq(table.id, params.requestUpdateId as string),
                with: {
                    chatrecord: true
                }
            })
            console.log(chat);
            // throw new Error('Not implemented');
            // const chats = await getChatRequests.execute({ requestUpdateId: params.requestUpdateId as string })
            return {
                chat
            };
        })
    );