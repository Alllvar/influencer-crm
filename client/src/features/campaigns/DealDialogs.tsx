import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { Creator, CreatorSummary, Deal } from '../../api/types';
import { useAddDealMutation, useCreatorsQuery, useUpdateDealMutation } from '../../api/endpoints';
import { applyFieldErrors, errorMessage } from '../../lib/errors';
import { formatCompact, PLATFORM_LABEL } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';
import { CreatorAvatar } from '../../components/chips';
import { useNotify } from '../../components/Notify';

const money = { setValueAs: (v: string) => (v === '' ? Number.NaN : Number(v)) };

const addSchema = z.object({
  creator: z.custom<Creator>((v) => Boolean(v), 'Pick a creator'),
  fee: z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative'),
  deliverables: z.string().max(500),
});
type AddValues = z.infer<typeof addSchema>;

interface AddCreatorProps {
  campaignId: string;
  existingIds: string[];
  onClose: () => void;
}

// MUI unmounts dialog content while closed, so the form inside starts fresh on every open
// without any manual resetting.
export function AddCreatorDialog({ open, ...props }: AddCreatorProps & { open: boolean }) {
  return (
    <Dialog open={open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <AddCreatorForm {...props} />
    </Dialog>
  );
}

function AddCreatorForm({ campaignId, existingIds, onClose }: AddCreatorProps) {
  const notify = useNotify();
  const [input, setInput] = useState('');
  const q = useDebounced(input.trim());
  const { data, isFetching } = useCreatorsQuery({ q, limit: 20, sort: '-followers' });
  const [addDeal, { isLoading, error }] = useAddDealMutation();

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { creator: undefined, fee: 0, deliverables: '' },
  });

  const options = (data?.items ?? []).filter((c) => !existingIds.includes(c.id));

  const submit = async (values: AddValues) => {
    try {
      await addDeal({
        campaignId,
        creatorId: values.creator.id,
        fee: values.fee,
        deliverables: values.deliverables,
      }).unwrap();
      notify(`${values.creator.name} invited`);
      onClose();
    } catch (e) {
      applyFieldErrors(e, setError);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(submit)}>
      <DialogTitle>Invite a creator</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage(error)}
          </Alert>
        )}
        <Stack sx={{ gap: 2, pt: 1 }}>
          <Controller
            name="creator"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={options}
                loading={isFetching}
                value={field.value ?? null}
                onChange={(_e, v) => field.onChange(v ?? undefined)}
                inputValue={input}
                onInputChange={(_e, v) => setInput(v)}
                filterOptions={(x) => x}
                getOptionLabel={(c) => `${c.name} (@${c.handle})`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                noOptionsText={q ? 'No creators found' : 'Start typing a name'}
                renderOption={({ key, ...props }, c) => (
                  <Box component="li" key={key} {...props} sx={{ display: 'flex', gap: 1.5 }}>
                    <CreatorAvatar name={c.name} platform={c.platform} size={30} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        @{c.handle} · {PLATFORM_LABEL[c.platform]} · {formatCompact(c.followers)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Creator"
                    autoFocus
                    error={Boolean(errors.creator)}
                    helperText={errors.creator?.message}
                  />
                )}
              />
            )}
          />
          <TextField
            label="Fee"
            type="number"
            {...register('fee', money)}
            error={Boolean(errors.fee)}
            helperText={errors.fee?.message ?? 'Can be agreed later'}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
          />
          <TextField label="Deliverables" placeholder="e.g. 1 reel + 3 stories" {...register('deliverables')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={isLoading}>
          Invite
        </Button>
      </DialogActions>
    </form>
  );
}

const editSchema = z.object({
  fee: z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative'),
  deliverables: z.string().max(500),
  contentUrl: z.union([z.url('Enter a full link, e.g. https://…'), z.literal('')]),
});
type EditValues = z.infer<typeof editSchema>;

export function EditDealDialog({
  campaignId,
  deal,
  onClose,
}: {
  campaignId: string;
  deal: Deal<CreatorSummary> | null;
  onClose: () => void;
}) {
  const notify = useNotify();
  const [updateDeal, { isLoading, error, reset: resetMutation }] = useUpdateDealMutation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    if (deal) {
      reset({ fee: deal.fee, deliverables: deal.deliverables, contentUrl: deal.contentUrl ?? '' });
      resetMutation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when another deal is opened
  }, [deal]);

  const submit = async (values: EditValues) => {
    if (!deal) return;
    try {
      await updateDeal({ campaignId, creatorId: deal.creator.id, ...values }).unwrap();
      notify('Deal updated');
      onClose();
    } catch (e) {
      applyFieldErrors(e, setError);
    }
  };

  return (
    <Dialog open={Boolean(deal)} onClose={onClose} maxWidth="xs" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{deal ? `Deal with ${deal.creator.name}` : 'Deal'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage(error)}
            </Alert>
          )}
          <Stack sx={{ gap: 2, pt: 1 }}>
            <TextField
              label="Fee"
              type="number"
              autoFocus
              {...register('fee', money)}
              error={Boolean(errors.fee)}
              helperText={errors.fee?.message}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
            />
            <TextField label="Deliverables" {...register('deliverables')} />
            <TextField
              label="Content link"
              placeholder="https://"
              {...register('contentUrl')}
              error={Boolean(errors.contentUrl)}
              helperText={errors.contentUrl?.message ?? 'Link to the published post'}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isLoading}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
