import { z, type ZodType } from 'zod';
import { loginSchema, registerSchema } from '../modules/auth/auth.schemas';
import { createCreatorSchema, listCreatorsQuery, updateCreatorSchema } from '../modules/creators/creator.schemas';
import {
  addCreatorSchema,
  createCampaignSchema,
  listCampaignsQuery,
  updateCampaignSchema,
  updateDealSchema,
} from '../modules/campaigns/campaign.schemas';

// The OpenAPI spec is generated from the same Zod schemas that validate requests,
// so the docs cannot drift away from what the API actually accepts.
const jsonSchema = (schema: ZodType) =>
  z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
    override: (ctx) => {
      if (ctx.zodSchema._zod.def.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date';
      }
    },
  });

const body = (schema: ZodType) => ({
  required: true,
  content: { 'application/json': { schema: jsonSchema(schema) } },
});

// Turns a Zod object of query params into OpenAPI "parameters".
const queryParams = (schema: ZodType) => {
  const s = jsonSchema(schema) as { properties?: Record<string, object> };
  return Object.entries(s.properties ?? {}).map(([name, schema]) => ({ name, in: 'query', schema }));
};

const idParam = (name = 'id') => ({ name, in: 'path', required: true, schema: { type: 'string' } });

const ok = (description: string) => ({ description });
const errors = {
  400: ok('Validation error'),
  401: ok('Missing or invalid access token'),
  404: ok('Not found'),
};

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Influencer CRM API',
    version: '1.0.0',
    description:
      'REST API for managing creators, campaigns and creator deals.\n\n' +
      '1. Call **POST /api/auth/login** (demo: `demo@influencer-crm.dev` / `demo12345`).\n' +
      '2. Copy `accessToken` from the response, press **Authorize** and paste it.\n\n' +
      'Errors always have the shape `{ "error": { "message": string, "details"?: object } }`.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
  security: [{ bearer: [] }],
  tags: [{ name: 'Auth' }, { name: 'Creators' }, { name: 'Campaigns' }, { name: 'Stats' }, { name: 'Users' }],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account (the first account becomes admin)',
        security: [],
        requestBody: body(registerSchema),
        responses: { 201: ok('User + access token; refresh token in an httpOnly cookie'), 409: ok('Email taken') },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        security: [],
        requestBody: body(loginSchema),
        responses: { 200: ok('User + access token; refresh token in an httpOnly cookie'), 401: ok('Wrong credentials') },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange the refresh cookie for a new access token (rotates the refresh token)',
        security: [],
        responses: { 200: ok('New access token'), 401: ok('Missing, expired or reused refresh token') },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Revoke the refresh token', security: [], responses: { 204: ok('Logged out') } },
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user', responses: { 200: ok('User'), 401: errors[401] } },
    },
    '/api/creators': {
      get: {
        tags: ['Creators'],
        summary: 'List creators with search, filters and pagination',
        parameters: queryParams(listCreatorsQuery),
        responses: { 200: ok('{ items, page, limit, total, totalPages }'), 400: errors[400] },
      },
      post: {
        tags: ['Creators'],
        summary: 'Add a creator',
        requestBody: body(createCreatorSchema),
        responses: { 201: ok('Created'), 400: errors[400], 409: ok('Handle already exists on this platform') },
      },
    },
    '/api/creators/{id}': {
      parameters: [idParam()],
      get: { tags: ['Creators'], summary: 'Creator profile with their campaigns', responses: { 200: ok('Creator'), 404: errors[404] } },
      patch: {
        tags: ['Creators'],
        summary: 'Update a creator',
        requestBody: body(updateCreatorSchema),
        responses: { 200: ok('Updated'), 400: errors[400], 404: errors[404] },
      },
      delete: {
        tags: ['Creators'],
        summary: 'Delete a creator (admin)',
        responses: { 204: ok('Deleted'), 403: ok('Admins only'), 409: ok('Creator is part of a campaign') },
      },
    },
    '/api/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaigns',
        parameters: queryParams(listCampaignsQuery),
        responses: { 200: ok('{ items, page, limit, total, totalPages }') },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create a campaign',
        requestBody: body(createCampaignSchema),
        responses: { 201: ok('Created'), 400: errors[400] },
      },
    },
    '/api/campaigns/{id}': {
      parameters: [idParam()],
      get: { tags: ['Campaigns'], summary: 'Campaign with populated creator deals', responses: { 200: ok('Campaign'), 404: errors[404] } },
      patch: {
        tags: ['Campaigns'],
        summary: 'Update a campaign',
        requestBody: body(updateCampaignSchema),
        responses: { 200: ok('Updated'), 400: errors[400], 404: errors[404] },
      },
      delete: { tags: ['Campaigns'], summary: 'Delete a campaign (admin)', responses: { 204: ok('Deleted'), 403: ok('Admins only') } },
    },
    '/api/campaigns/{id}/creators': {
      parameters: [idParam()],
      post: {
        tags: ['Campaigns'],
        summary: 'Invite a creator to the campaign',
        requestBody: body(addCreatorSchema),
        responses: { 201: ok('Updated campaign'), 404: errors[404], 409: ok('Creator already in the campaign') },
      },
    },
    '/api/campaigns/{id}/creators/{creatorId}': {
      parameters: [idParam(), idParam('creatorId')],
      patch: {
        tags: ['Campaigns'],
        summary: 'Update a deal: move it through the pipeline, change the fee, add the content link',
        requestBody: body(updateDealSchema),
        responses: { 200: ok('Updated campaign'), 404: errors[404] },
      },
      delete: { tags: ['Campaigns'], summary: 'Remove a creator from the campaign', responses: { 200: ok('Updated campaign') } },
    },
    '/api/stats/overview': {
      get: { tags: ['Stats'], summary: 'Dashboard numbers (MongoDB aggregations)', responses: { 200: ok('Overview') } },
    },
    '/api/users': {
      get: { tags: ['Users'], summary: 'List team members (admin)', responses: { 200: ok('Users'), 403: ok('Admins only') } },
    },
    '/api/users/{id}/role': {
      parameters: [idParam()],
      patch: {
        tags: ['Users'],
        summary: 'Change a team member role (admin)',
        requestBody: body(z.object({ role: z.enum(['admin', 'manager']) })),
        responses: { 200: ok('Updated user'), 403: ok('Admins only') },
      },
    },
  },
};
