import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";

import { MdDarkMode, MdLightMode, MdAutoMode } from "react-icons/md";
// import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa'; // Font Awesome sub-folder

import { useTheme } from "../util/darkmode.tsx"; // Custom hook to detect system dark mode preference

export default function HeaderBar() {
  const { theme, cycleTheme } = useTheme();
  return (
    <AppBar position="static">
      <Toolbar>
        {/* Add a header title and subtitle! */}
        {/* Header Title - expands to push the theme toggle to the right */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Soundbox
          <Typography variant="subtitle2" component="div" sx={{ flexGrow: 1 }}>
            Self-hosted audio visualization
          </Typography>
        </Typography>

        {/* Theme Toggle Button */}
        <IconButton
          className="theme-icon"
          edge="end"
          color="inherit"
          aria-label="toggle dark mode"
          onClick={cycleTheme}
        >
          {theme === "light" ? (
            <MdLightMode />
          ) : theme === "dark" ? (
            <MdDarkMode />
          ) : (
            <MdAutoMode />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
