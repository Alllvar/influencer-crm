import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  InputAdornment,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { CAMPAIGN_STATUSES, PLATFORMS, type Campaign } from '../../api/types';
import { useCreateCampaignMutation, useUpdateCampaignMutation } from '../../api/endpoints';
import { applyFieldErrors, errorMessage } from '../../lib/errors';
import { PLATFORM_LABEL, STATUS_LABEL, toDateInput } from '../../lib/format';
import { useNotify } from '../../components/Notify';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Required').max(120),
    brand: z.string().trim().min(1, 'Required').max(120),
    description: z.string().max(5000),
    status: z.enum(CAMPAIGN_STATUSES),
    platforms: z.array(z.enum(PLATFORMS)).min(1, 'Pick at least one platform'),
    budget: z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative'),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: 'Must be on or after the start date',
    path: ['endDate'],
  });
type FormValues = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const empty = (): FormValues => ({
  name: '',
  brand: '',
  description: '',
  status: 'draft',
  platforms: ['instagram'],
  budget: 5000,
  startDate: today(),
  endDate: inDays(30),
});

const toForm = (c: Campaign<unknown>): FormValues => ({
  name: c.name,
  brand: c.brand,
  description: c.description,
  status: c.status,
  platforms: c.platforms,
  budget: c.budget,
  startDate: toDateInput(c.startDate),
  endDate: toDateInput(c.endDate),
});

export function CampaignFormDialog({
  open,
  campaign,
  onClose,
  onCreated,
}: {
  open: boolean;
  campaign?: Campaign<unknown>;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const notify = useNotify();
  const [create, createState] = useCreateCampaignMutation();
  const [update, updateState] = useUpdateCampaignMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const error = createState.error ?? updateState.error;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty() });

  useEffect(() => {
    if (open) {
      reset(campaign ? toForm(campaign) : empty());
      createState.reset();
      updateState.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open, campaign]);

  const submit = async (values: FormValues) => {
    try {
      if (campaign) {
        await update({ id: campaign.id, ...values }).unwrap();
        notify('Campaign updated');
        onClose();
      } else {
        const { campaign: created } = await create(values).unwrap();
        notify('Campaign created');
        onClose();
        onCreated?.(created.id);
      }
    } catch (e) {
      applyFieldErrors(e, setError);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{campaign ? 'Edit campaign' : 'New campaign'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage(error)}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { sm: '1fr 1fr' }, pt: 1 }}>
            <TextField
              label="Campaign name"
              autoFocus
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField
              label="Brand"
              {...register('brand')}
              error={Boolean(errors.brand)}
              helperText={errors.brand?.message}
            />
            <TextField
              label="Budget"
              type="number"
              {...register('budget', { setValueAs: (v: string) => (v === '' ? Number.NaN : Number(v)) })}
              error={Boolean(errors.budget)}
              helperText={errors.budget?.message}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField select label="Status" {...field}>
                  {CAMPAIGN_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="Start date"
              type="date"
              {...register('startDate')}
              error={Boolean(errors.startDate)}
              helperText={errors.startDate?.message}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End date"
              type="date"
              {...register('endDate')}
              error={Boolean(errors.endDate)}
              helperText={errors.endDate?.message}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Controller
              name="platforms"
              control={control}
              render={({ field }) => (
                <FormControl error={Boolean(errors.platforms)} sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <FormLabel sx={{ mb: 0.5 }}>Platforms</FormLabel>
                  <FormGroup row>
                    {PLATFORMS.map((p) => (
                      <FormControlLabel
                        key={p}
                        label={PLATFORM_LABEL[p]}
                        control={
                          <Checkbox
                            checked={field.value.includes(p)}
                            onChange={(e) =>
                              field.onChange(
                                e.target.checked ? [...field.value, p] : field.value.filter((v) => v !== p),
                              )
                            }
                          />
                        }
                      />
                    ))}
                  </FormGroup>
                  {errors.platforms && <FormHelperText>{errors.platforms.message}</FormHelperText>}
                </FormControl>
              )}
            />
            <TextField
              label="Brief"
              multiline
              minRows={3}
              {...register('description')}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={saving}>
            {campaign ? 'Save changes' : 'Create campaign'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
