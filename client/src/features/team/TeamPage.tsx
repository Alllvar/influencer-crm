import {
  Avatar,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { Role } from '../../api/types';
import { useChangeRoleMutation, useUsersQuery } from '../../api/endpoints';
import { useAppSelector } from '../../app/store';
import { ErrorState, Loading, PageHeader } from '../../components/common';
import { useNotify } from '../../components/Notify';
import { errorMessage } from '../../lib/errors';
import { formatDate, initials } from '../../lib/format';

export function TeamPage() {
  const me = useAppSelector((s) => s.auth.user);
  const notify = useNotify();
  const { data, isLoading, error, refetch } = useUsersQuery();
  const [changeRole] = useChangeRoleMutation();

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const setRole = async (id: string, role: Role, name: string) => {
    try {
      await changeRole({ id, role }).unwrap();
      notify(`${name} is now ${role === 'admin' ? 'an admin' : 'a manager'}`);
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Admins can delete records and manage roles. Managers work with creators and campaigns."
      />
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell sx={{ width: 180 }}>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main' }}>
                        {initials(u.name)}
                      </Avatar>
                      <div>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {u.name}{' '}
                          {u.id === me?.id && (
                            <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                              (you)
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {u.email}
                        </Typography>
                      </div>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={u.role}
                      disabled={u.id === me?.id}
                      onChange={(e) => setRole(u.id, e.target.value as Role, u.name)}
                      slotProps={{ htmlInput: { 'aria-label': `Role of ${u.name}` } }}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
