import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/skrivly-developer-api",
    },
    {
      type: "category",
      label: "Organisation",
      link: {
        type: "doc",
        id: "api/organisation",
      },
      items: [
        {
          type: "doc",
          id: "api/get-organisation-reference",
          label: "Get Organisation Reference ID",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Documents",
      link: {
        type: "doc",
        id: "api/documents",
      },
      items: [
        {
          type: "doc",
          id: "api/create-document",
          label: "Create a Document",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-document-details",
          label: "Retrieve Document Details",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/send-document",
          label: "Send Document for Signing",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Signers",
      link: {
        type: "doc",
        id: "api/signers",
      },
      items: [
        {
          type: "doc",
          id: "api/add-signers",
          label: "Add Signers to a Document",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/update-signer-status",
          label: "Update Signer Status",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Reminders & Resend",
      link: {
        type: "doc",
        id: "api/reminders-resend",
      },
      items: [
        {
          type: "doc",
          id: "api/send-reminder",
          label: "Send Reminder to Signers",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/resend-signed-document",
          label: "Resend Signed Document",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
