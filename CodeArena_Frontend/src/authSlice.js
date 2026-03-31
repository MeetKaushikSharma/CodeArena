import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "./utils/axiosClient";

// ── Register ───────────────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/register", userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

// ── Login ──────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/login", credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

// ── Check Auth (used on app load + after OAuth redirect) ───────────
export const checkAuth = createAsyncThunk(
  "auth/check",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get("/user/check");
      return data.user;
    } catch (error) {
      if (error.response?.status === 401) return null;
      return rejectWithValue(
        error.response?.data?.error || error.message || "Network Error",
      );
    }
  },
);

// ── Logout ─────────────────────────────────────────────────────────
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post("/user/logout");
      return null;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

// ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:            null,
    isAuthenticated: false,
    loading:         false,
    error:           null,
  },
  reducers: {
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // ← Used to clear error shown on login/signup page
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ── Register ─────────────────────────────────────────────────
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading         = false;
        state.isAuthenticated = !!action.payload;
        state.user            = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload?.response?.data?.error || "Something went wrong";
        state.isAuthenticated = false;
        state.user            = null;
      })

      // ── Login ────────────────────────────────────────────────────
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading         = false;
        state.isAuthenticated = !!action.payload;
        state.user            = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload?.response?.data?.error || "Something went wrong";
        state.isAuthenticated = false;
        state.user            = null;
      })

      // ── Check Auth ───────────────────────────────────────────────
      // Only show spinner if not already logged in (avoids flash on page refresh)
      .addCase(checkAuth.pending, (state) => {
        if (!state.user) state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user            = { ...(state.user || {}), ...action.payload };
        } else {
          state.isAuthenticated = false;
          state.user            = null;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading         = false;
        state.isAuthenticated = false;
        state.user            = null;
        // ← Don't set error here — checkAuth failing just means not logged in
      })

      // ── Logout ───────────────────────────────────────────────────
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading         = false;
        state.user            = null;
        state.isAuthenticated = false;
        state.error           = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload?.message || "Something went wrong";
        state.isAuthenticated = false;
        state.user            = null;
      });
  },
});

export const { updateUserProfile, clearError } = authSlice.actions;
export default authSlice.reducer;