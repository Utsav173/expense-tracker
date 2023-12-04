import { createSlice } from "@reduxjs/toolkit";

const storedDarkMode = localStorage.getItem("darkMode");

export const darkModeSlice = createSlice({
  name: "darkMode",
  initialState: {
    value: storedDarkMode ? storedDarkMode === "true" : false,
  },
  reducers: {
    toggleDarkMode: (state) => {
      const newValue = !state.value;
      localStorage.setItem("darkMode", newValue);
      state.value = newValue;
    },
  },
});

export const { toggleDarkMode } = darkModeSlice.actions;

export const selectDarkMode = (state) => state.darkMode.value;

export default darkModeSlice.reducer;
