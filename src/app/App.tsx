import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { useAppDispatch } from '../shared/store/hooks';
import { loadUser } from '../entities/user';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;
