import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PLATFORMS, type Creator } from '../../api/types';
import { useCreateCreatorMutation, useUpdateCreatorMutation } from '../../api/endpoints';
import { applyFieldErrors, errorMessage } from '../../lib/errors';
import { PLATFORM_LABEL } from '../../lib/format';
import { useNotify } from '../../components/Notify';

const NICHE_SUGGESTIONS = [
  'beauty',
  'fashion',
  'fitness',
  'food',
  'gaming',
  'tech',
  'travel',
  'family',
  'finance',
  'education',
  'lifestyle',
];

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(100),
  handle: z.string().trim().min(1, 'Required').max(60),
  platform: z.enum(PLATFORMS),
  email: z.union([z.email('Enter a valid email'), z.literal('')]),
  country: z.string().trim().max(60),
  niches: z.array(z.string()).max(10, 'Up to 10 niches'),
  followers: z.number({ error: 'Enter a number' }).int().min(0, 'Cannot be negative'),
  engagementRate: z.number({ error: 'Enter a number' }).min(0).max(100, 'Max 100%'),
  notes: z.string().max(2000),
});
type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  name: '',
  handle: '',
  platform: 'instagram',
  email: '',
  country: '',
  niches: [],
  followers: 0,
  engagementRate: 0,
  notes: '',
};

const toForm = (c: Creator): FormValues => ({
  name: c.name,
  handle: c.handle,
  platform: c.platform,
  email: c.email ?? '',
  country: c.country ?? '',
  niches: c.niches,
  followers: c.followers,
  engagementRate: c.engagementRate,
  notes: c.notes,
});

// One dialog for both "add" and "edit": with a creator it edits, without one it creates.
export function CreatorFormDialog({
  open,
  creator,
  onClose,
}: {
  open: boolean;
  creator?: Creator;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const notify = useNotify();
  const [create, createState] = useCreateCreatorMutation();
  const [update, updateState] = useUpdateCreatorMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const error = createState.error ?? updateState.error;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  useEffect(() => {
    if (open) {
      reset(creator ? toForm(creator) : empty);
      createState.reset();
      updateState.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open, creator]);

  const submit = async (values: FormValues) => {
    try {
      if (creator) {
        await update({ id: creator.id, ...values }).unwrap();
        notify('Creator updated');
      } else {
        await create(values).unwrap();
        notify('Creator added');
      }
      onClose();
    } catch (e) {
      applyFieldErrors(e, setError);
    }
  };

  const numberField = { setValueAs: (v: string) => (v === '' ? Number.NaN : Number(v)) };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{creator ? 'Edit creator' : 'Add creator'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage(error)}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr' }, pt: 1 }}>
            <TextField
              label="Name"
              autoFocus
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <Controller
              name="platform"
              control={control}
              render={({ field }) => (
                <TextField select label="Platform" {...field}>
                  {PLATFORMS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="Handle"
              {...register('handle')}
              error={Boolean(errors.handle)}
              helperText={errors.handle?.message}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
            />
            <TextField
              label="Email"
              type="email"
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
            <TextField
              label="Followers"
              type="number"
              {...register('followers', numberField)}
              error={Boolean(errors.followers)}
              helperText={errors.followers?.message}
            />
            <TextField
              label="Engagement rate"
              type="number"
              {...register('engagementRate', numberField)}
              error={Boolean(errors.engagementRate)}
              helperText={errors.engagementRate?.message}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                htmlInput: { step: 0.1 },
              }}
            />
            <TextField label="Country" {...register('country')} />
            <Controller
              name="niches"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={NICHE_SUGGESTIONS}
                  value={field.value}
                  onChange={(_e, value) => field.onChange(value.map((v) => v.trim().toLowerCase()).filter(Boolean))}
                  renderValue={(value, getItemProps) =>
                    value.map((option, index) => {
                      const { key, ...itemProps } = getItemProps({ index });
                      return <Chip key={key} size="small" label={option} {...itemProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Niches"
                      error={Boolean(errors.niches)}
                      helperText={errors.niches?.message ?? 'Type and press Enter'}
                    />
                  )}
                />
              )}
            />
            <TextField
              label="Notes"
              multiline
              minRows={3}
              {...register('notes')}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={saving}>
            {creator ? 'Save changes' : 'Add creator'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
