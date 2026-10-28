import { baseApi } from './baseApi';
import type {
  Campaign,
  CampaignStatus,
  CampaignWithCreators,
  Creator,
  Overview,
  Page,
  PipelineStage,
  Platform,
  Role,
  User,
} from './types';

export interface CreatorInput {
  name: string;
  handle: string;
  platform: Platform;
  email?: string;
  country?: string;
  niches: string[];
  followers: number;
  engagementRate: number;
  notes: string;
}

export interface CampaignInput {
  name: string;
  brand: string;
  description: string;
  status: CampaignStatus;
  platforms: Platform[];
  budget: number;
  startDate: string;
  endDate: string;
}

export interface CreatorsQuery {
  q?: string;
  platform?: Platform | '';
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CampaignsQuery {
  q?: string;
  status?: CampaignStatus | '';
  page?: number;
  limit?: number;
}

type Session = { user: User; accessToken: string };

// Drops empty values so the URL stays clean: { q: '', page: 1 } → "?page=1".
const clean = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---------- Auth ----------
    login: build.mutation<Session, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<Session, { email: string; name: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),

    // ---------- Dashboard ----------
    overview: build.query<Overview, void>({
      query: () => '/stats/overview',
      providesTags: ['Stats'],
    }),

    // ---------- Creators ----------
    creators: build.query<Page<Creator>, CreatorsQuery>({
      query: (params) => ({ url: '/creators', params: clean(params) }),
      providesTags: (res) => [
        { type: 'Creator', id: 'LIST' },
        ...(res?.items.map((c) => ({ type: 'Creator' as const, id: c.id })) ?? []),
      ],
    }),
    creator: build.query<{ creator: Creator; campaigns: Campaign[] }, string>({
      query: (id) => `/creators/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Creator', id }],
    }),
    createCreator: build.mutation<{ creator: Creator }, CreatorInput>({
      query: (body) => ({ url: '/creators', method: 'POST', body }),
      invalidatesTags: [{ type: 'Creator', id: 'LIST' }, 'Stats'],
    }),
    updateCreator: build.mutation<{ creator: Creator }, { id: string } & Partial<CreatorInput>>({
      query: ({ id, ...body }) => ({ url: `/creators/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Creator', id }, { type: 'Creator', id: 'LIST' }, 'Stats'],
    }),
    deleteCreator: build.mutation<void, string>({
      query: (id) => ({ url: `/creators/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Creator', id: 'LIST' }, 'Stats'],
    }),

    // ---------- Campaigns ----------
    campaigns: build.query<Page<Campaign>, CampaignsQuery>({
      query: (params) => ({ url: '/campaigns', params: clean(params) }),
      providesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),
    campaign: build.query<{ campaign: CampaignWithCreators }, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Campaign', id }],
    }),
    createCampaign: build.mutation<{ campaign: Campaign }, CampaignInput>({
      query: (body) => ({ url: '/campaigns', method: 'POST', body }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }, 'Stats'],
    }),
    updateCampaign: build.mutation<{ campaign: CampaignWithCreators }, { id: string } & Partial<CampaignInput>>({
      query: ({ id, ...body }) => ({ url: `/campaigns/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Campaign', id }, { type: 'Campaign', id: 'LIST' }, 'Stats'],
    }),
    deleteCampaign: build.mutation<void, string>({
      query: (id) => ({ url: `/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }, 'Stats'],
    }),
    addDeal: build.mutation<
      { campaign: CampaignWithCreators },
      { campaignId: string; creatorId: string; fee: number; deliverables: string }
    >({
      query: ({ campaignId, ...body }) => ({ url: `/campaigns/${campaignId}/creators`, method: 'POST', body }),
      invalidatesTags: (_res, _err, { campaignId, creatorId }) => [
        { type: 'Campaign', id: campaignId },
        { type: 'Campaign', id: 'LIST' },
        { type: 'Creator', id: creatorId },
        'Stats',
      ],
    }),
    updateDeal: build.mutation<
      { campaign: CampaignWithCreators },
      {
        campaignId: string;
        creatorId: string;
        stage?: PipelineStage;
        fee?: number;
        deliverables?: string;
        contentUrl?: string;
      }
    >({
      query: ({ campaignId, creatorId, ...body }) => ({
        url: `/campaigns/${campaignId}/creators/${creatorId}`,
        method: 'PATCH',
        body,
      }),
      // Optimistic update: the card moves to the new column immediately and moves back if the request fails.
      async onQueryStarted({ campaignId, creatorId, ...patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          api.util.updateQueryData('campaign', campaignId, (draft) => {
            const deal = draft.campaign.creators.find((d) => d.creator?.id === creatorId);
            if (deal) Object.assign(deal, patch);
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(api.util.upsertQueryData('campaign', campaignId, data));
        } catch {
          undo.undo();
        }
      },
      invalidatesTags: (_res, _err, { creatorId }) => [
        { type: 'Campaign', id: 'LIST' },
        { type: 'Creator', id: creatorId },
        'Stats',
      ],
    }),
    removeDeal: build.mutation<{ campaign: CampaignWithCreators }, { campaignId: string; creatorId: string }>({
      query: ({ campaignId, creatorId }) => ({
        url: `/campaigns/${campaignId}/creators/${creatorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { campaignId, creatorId }) => [
        { type: 'Campaign', id: campaignId },
        { type: 'Campaign', id: 'LIST' },
        { type: 'Creator', id: creatorId },
        'Stats',
      ],
    }),

    // ---------- Team ----------
    users: build.query<{ users: User[] }, void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    changeRole: build.mutation<{ user: User }, { id: string; role: Role }>({
      query: ({ id, role }) => ({ url: `/users/${id}/role`, method: 'PATCH', body: { role } }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useOverviewQuery,
  useCreatorsQuery,
  useCreatorQuery,
  useCreateCreatorMutation,
  useUpdateCreatorMutation,
  useDeleteCreatorMutation,
  useCampaignsQuery,
  useCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useAddDealMutation,
  useUpdateDealMutation,
  useRemoveDealMutation,
  useUsersQuery,
  useChangeRoleMutation,
} = api;
