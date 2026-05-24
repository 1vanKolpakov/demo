import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
// FSD note: shared→app import is a pragmatic compromise for typed Redux hooks.
import type { AppDispatch, RootState } from '../../app/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
