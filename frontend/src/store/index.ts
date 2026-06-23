import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import testReducer from '../features/testSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    test: testReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export default store;
