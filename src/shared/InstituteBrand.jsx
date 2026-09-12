import React from "react";

const splitInstituteName = (value) => {
  const text = String(value || "").trim();
  if (!text) return { firstLine: "", secondLine: "" };

  const highSchoolMatch = text.match(/^(.*?)(\b(?:EM\s+)?HIGH\s+SCHOOL\b.*)$/i);
  if (highSchoolMatch) {
    return {
      firstLine: String(highSchoolMatch[1] || "").trim(),
      secondLine: String(highSchoolMatch[2] || "").trim(),
    };
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return { firstLine: text, secondLine: "" };
  }

  return {
    firstLine: words[0],
    secondLine: words.slice(1).join(" "),
  };
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const InstituteBrand = ({
  logoSrc,
  logoAlt = "Institute Logo",
  instituteName = "",
  className = "",
  logoClassName = "",
  nameClassName = "",
}) => {
  const normalizedName = String(instituteName || "").trim();
  const { firstLine, secondLine } = splitInstituteName(normalizedName);

  return (
    <div className={joinClasses("dashboard-school-brand accountant-school-brand", className)}>
      {logoSrc ? (
        <img src={logoSrc} alt={logoAlt} className={joinClasses("dashboard-school-logo accountant-school-logo", logoClassName)} />
      ) : null}
      {normalizedName ? (
        <span className={joinClasses("dashboard-school-name accountant-school-name", nameClassName)}>
          <span className="dashboard-school-name-line dashboard-school-name-line-primary accountant-school-name-line accountant-school-name-line-primary">
            {firstLine}
          </span>
          {secondLine ? (
            <span className="dashboard-school-name-line dashboard-school-name-line-secondary accountant-school-name-line accountant-school-name-line-secondary">
              {secondLine}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
};

export default InstituteBrand;
