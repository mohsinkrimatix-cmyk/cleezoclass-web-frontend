export const getUserDisplayName = (fallback = "User") => {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }

  const storedName = String(window.localStorage.getItem("name") || "").trim();
  if (storedName) return storedName;

  const storedUsername = String(window.localStorage.getItem("username") || "").trim();
  if (storedUsername) return storedUsername;

  return fallback;
};
