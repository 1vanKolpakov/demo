import { configureStore } from '@reduxjs/toolkit';
import { userReducer } from '../entities/user';
import { groupsReducer } from '../entities/group';

export const store = configureStore({
  reducer: {
    user: userReducer,
    groups: groupsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
