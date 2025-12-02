import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    // Remove both classes first
    document.documentElement.classList.remove("light", "dark");
    
    // Add the current theme class
    document.documentElement.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ✅ FIXED: Accept newTheme parameter instead of toggling
  const toggleTheme = (newTheme) => {
    if (newTheme) {
      // If parameter provided, use it
      setTheme(newTheme);
    } else {
      // If no parameter, toggle between light and dark
      setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);