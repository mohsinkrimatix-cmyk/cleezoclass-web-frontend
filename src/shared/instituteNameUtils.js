export const formatInstituteCode = (schoolCodeValue) => {
  const value = String(schoolCodeValue || "").trim();
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bE\s*\.?\s*M\b/gi, "(E.M)")
    .replace(/\bE\s*\.?\s*M\s*HIGH\s*SCHOOL\b/gi, "(E.M) HIGH SCHOOL")
    .replace(/\bHIGH\s*SCHOOL\b/gi, "HIGH SCHOOL")
    .replace(/\bMOTHERLAND\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^,\s*/, "");
};

export const isLikelyDatabaseCode = (value) => {
  const text = String(value || "").trim();
  return Boolean(text) && /^[A-Z0-9_]+$/.test(text) && text.includes("_") && !text.includes(" ");
};

export const resolveInstituteDisplayName = ({
  apiInstituteName = "",
  storedSchoolName = "",
  storedInstituteName = "",
  schoolCode = "",
  fallback = "Unknown School",
}) => {
  const apiName = String(apiInstituteName || "").trim();
  const readableApiName = apiName && !isLikelyDatabaseCode(apiName) ? apiName : "";
  const storedSchool = String(storedSchoolName || "").trim();
  const storedInstitute = String(storedInstituteName || "").trim();
  const codeName = formatInstituteCode(schoolCode) || String(schoolCode || "").trim();

  return String(
    readableApiName ||
      storedSchool ||
      storedInstitute ||
      codeName ||
      fallback
  ).trim();
};
