import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchUserAdminGroups } from '../api';

interface GroupsState {
  adminGroupIds: string[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  adminGroupIds: [],
  loading: false,
  initialized: false,
  error: null,
};

export const loadUserAdminGroups = createAsyncThunk('groups/loadAdminGroups', () =>
  fetchUserAdminGroups()
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserAdminGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserAdminGroups.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.loading = false;
        state.initialized = true;
        state.adminGroupIds = action.payload;
      })
      .addCase(loadUserAdminGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка загрузки групп';
      });
  },
});

export default groupsSlice.reducer;
