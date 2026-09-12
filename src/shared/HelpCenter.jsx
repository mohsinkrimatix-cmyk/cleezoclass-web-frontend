import React from "react";

const HelpCenter = ({
  userRole,
  openHelpSection,
  setOpenHelpSection,
  setIsHelpOpen,
}) => {

  const helpSections = [
    {
      id: "fee-types",
      title: "Create Fee Types",
      allowedRoles: ["accountant", "Admin", "management"],
      videos: [
        {
          title: "How to Create Fee Types",
          url: "https://www.youtube.com/embed/YDDg-53l1m4",
        },
      ],
    },

    {
      id: "add-fees",
      title: "Add Fees",
      allowedRoles: ["accountant", "Admin"],
      videos: [
        {
          title: "Add Fees To Classes",
          url: "https://www.youtube.com/embed/N1eL9bcckmU",
        },
      ],
    },

    {
      id: "discount",
      title: "Discount",
      allowedRoles: ["accountant", "Admin", "management"],
      videos: [
        {
          title: "How Add Discount",
          url: "https://www.youtube.com/embed/D8KYWewLmcA",
        },
      ],
    },

    {
      id: "collect-fees",
      title: "Collect Fees",
      allowedRoles: ["accountant", "Admin", "management"],
      videos: [
        {
          title: "Collect Student Fees",
          url: "https://www.youtube.com/embed/HYEj21AQAxk",
        },
      ],
    },

    {
      id: "expenses",
      title: "Expenses",
      allowedRoles: ["accountant", "Admin", "management"],
      videos: [
        {
          title: "How To Use Expense Option",
          url: "https://www.youtube.com/embed/tGwDbBJqoYY",
        },
      ],
    },

    {
      id: "Campaigning",
      title: "Campaigning",
      allowedRoles: ["Teacher", "Principal", "admin"],
      videos: [
        {
          title: "How To Use Campaigning",
          url: "https://www.youtube.com/embed/-j5zsmD-Liw?si=Zr_HWy-Hi1xD2Sjt",
        },
      ],
    },

    {
      id: "Acadamics",
      title: "Academics",
      allowedRoles: ["Teacher", "Principal", "admin"],
      videos: [
        {
          title: "Student Academics",
          url: "https://www.youtube.com/embed/c59Z-uoT4AE",
        },
      ],
    },

    {
      id: "Admissions",
      title: "Admissions",
      allowedRoles: ["Admission Counsellor", "admin"],
      videos: [
        {
          title: "Student Admission",
          url: "https://www.youtube.com/embed/3hvJCensQg0",
        },
      ],
    },

    {
      id: "Reportcards",
      title: "Report Cards",
      allowedRoles: ["admin", "management"],
      videos: [
        {
          title: "How To Use Report Cards",
          url: "https://www.youtube.com/embed/tiQVnU1n3Iw",
        },
      ],
    },
  ];

  return (
    <div
      className="accountant-help-overlay"
      onClick={() => setIsHelpOpen(false)}
    >
      <div
        className="accountant-help-sidebar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="accountant-help-header">
          <div className="accountant-help-banner">
<h4 style={{ 
  display: "flex", 
  alignItems: "center", 
  gap: "10px",
  margin: 0,
  fontSize: "20px",
  color: "#2d3748",
  fontWeight: 600,
}}>
  <span>Welcome to</span>
  <span style={{
    padding: "4px 14px",
    background: "linear-gradient(135deg, #f9b1b8, #f9b1b8)",
    color: "#fff",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow: "0 4px 12px rgba(222, 134, 143, 0.3)",
  }}>
    Cleezo-class
  </span>
   Help Center
</h4>

            <p>
              Browse tutorials and training videos
              based on your role.
            </p>
          </div>

          <button
            className="accountant-help-close"
            onClick={() => setIsHelpOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="accountant-help-accordion">
          {helpSections
            .filter(
              (section) =>
                !section.allowedRoles ||
                section.allowedRoles.includes(userRole)
            )
            .map((section) => (
              <div
                key={section.id}
                className="accountant-help-accordion-item"
              >
                <button
                  className="accountant-help-accordion-header"
                  onClick={() =>
                    setOpenHelpSection(
                      openHelpSection === section.id
                        ? null
                        : section.id
                    )
                  }
                >
                  <span>{section.title}</span>

                  <span>
                    {openHelpSection === section.id
                      ? "−"
                      : "+"}
                  </span>
                </button>

                {openHelpSection === section.id && (
                  <div className="accountant-help-accordion-content">
                    {section.videos.map((video, index) => (
                      <div
                        key={index}
                        className="accountant-help-video-card"
                      >
                        <h5>{video.title}</h5>

                     <button
  className="accountant-help-video-open-btn"
  onClick={() => {
    setIsHelpOpen(false);

    window.open(
      `https://cleezoclass.com/help?tutorial=${section.id}`,
      "_blank"
    );
  }}
>
  ▶ Watch Tutorial
</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;