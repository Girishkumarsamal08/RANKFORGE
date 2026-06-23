import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout as logoutAction, setCredentials } from '../features/authSlice';
import { useRouter } from 'next/navigation';
import { User } from '../types';

export function useAuth() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const loginUser = (user: User, token: string) => {
    dispatch(setCredentials({ user, token }));
  };

  const logoutUser = () => {
    dispatch(logoutAction());
    router.push('/login');
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    loginUser,
    logoutUser,
  };
}
