n---
id: user-guide
title: User Guide - Developer Settings
sidebar_position: 4
---

# User Guide: Developer Settings

Welcome to the Skrivly Developer Platform! This guide will help you understand how to use the Developer Settings section to integrate Skrivly's e-signature capabilities into your own applications.

## Overview
The Developer Settings section allows you to manage your developer account, generate API keys, track your API usage, and manage billing for programmatic access to Skrivly.

---

## Getting Started

### 1. Signing Up as a Developer

**If you already have a Skrivly account:**
1. Navigate to the **Developer Settings** section in your dashboard.
2. Follow the signup flow to create your developer account.
3. You will receive an OTP via email to verify your identity.
4. Set a password for your developer account (used only for initial setup).

**If you are new to Skrivly:**
1. Go to the Developer Signup page.
2. Provide your email and follow the steps to create both a Skrivly account and a Developer account.
3. You will be prompted to set up a payment method via Stripe.

### 2. Passwordless Login
Once your account is created, login is **passwordless**. Simply enter your email, and you will receive a 6-digit OTP to log in securely.

---

## API Key Management

:::info Enterprise Requirement
API key generation requires an **Enterprise Plan**.
:::

### Generating an API Key
1. Go to the **API Keys** tab.
2. Click **Create New API Key**.
3. Give your key a descriptive name (e.g., "Production Web App").

:::warning IMPORTANT
Save your **API Key** and **API Secret** immediately. For security reasons, the secret is shown only once and cannot be retrieved later.
:::

### Managing Keys
- **Regenerate**: If you need to rotate your keys or if a key is compromised, use the "Regenerate" option. This will revoke the old key and issue a new one.
- **Revoke**: If you no longer need a key, you can revoke it to prevent any further access.

---

## Usage Tracking & Dashboard

### Monitoring Activity
The **Dashboard** provides a high-level overview of your API activity, including successful and failed requests.

### Detailed Usage Logs
Under the **Usage Logs** tab, you can:
- View every API request made with your keys.
- See feature usage (e.g., how many E-signatures or BankID signatures were processed).
- Track the cost associated with each request.
- Export your usage logs as CSV for further analysis.

---

## Billing & Invoices

### How Billing Works
Skrivly uses a pay-as-you-go model for developer API usage. Costs are calculated based on:
1. **Base Price**: A small fee per API request.
2. **Feature Costs**: Additional charges for specific features like BankID signatures.

### Managing Invoices
- **Current Month**: View your accrued costs for the current billing cycle.
- **Invoices**: Access and download past monthly invoices.
- **Payment Methods**: Update your credit card details at any time to ensure uninterrupted service.

---

## Integrating with the API

For technical documentation on available endpoints and authentication methods, please refer to the **API Reference** documentation available in the Developer Portal.

- **Authentication**: Use `Authorization: Bearer <your-api-key>` in all requests.
- **Base URL**: Use `http://localhost:8000/en/api/v1/` for production.

### Quick Start: Sending a Document for Signature

The document signing workflow involves four sequential steps:

#### Step 1: Get Organisation Reference ID

Retrieve your organisation's `encrypted_reference_id`, which is required to create documents.

```bash
curl --location "http://localhost:8000/en/api/v1/developer-settings/profile/organization/" \
  --header "Authorization: Bearer <your-api-key>"
```

The response will contain your `encrypted_reference_id` needed for Step 2.

#### Step 2: Create a Document

Upload a PDF document to your organisation. Both `document_file` and `latest_document_file` are required — send the same file for both.

```bash
curl --location "http://localhost:8000/en/api/v1/user-documents/details/" \
  --header "Authorization: Bearer <your-api-key>" \
  --form 'title="Sales Contract"' \
  --form 'encrypted_reference_id="<your_org_encrypted_reference_id>"' \
  --form 'document_file=@"/path/to/document.pdf"' \
  --form 'latest_document_file=@"/path/to/document.pdf"'
```

The response will contain `reference_id` (DOC_REF_ID) and `organization_document_encrypted_reference_id` (ORG_DOC_REF_ID) needed for the next steps.

#### Step 3: Add Signers

Add one or more signers to the document using the reference IDs from Step 2.

```bash
curl --location "http://localhost:8000/en/api/v1/user-documents/details/signers/?organisation_doc_reference_id=<ORG_DOC_REF_ID>&doc_reference_id=<DOC_REF_ID>" \
  --header "Authorization: Bearer <your-api-key>" \
  --header "Content-Type: application/json" \
  --data '[
    {
      "email": "john@example.com",
      "name": "John Doe",
      "signer_type": "default",
      "phone_number": "+46701234567"
    }
  ]'
```

The response will contain `reference_signer_id` for each signer, needed for Step 4.

#### Step 4: Send for Signing

Send email notifications to all signers using the `reference_signer_id` values from Step 3.

```bash
curl --location "http://localhost:8000/en/api/v1/user-documents/send-mail/?organisation_doc_reference_id=<ORG_DOC_REF_ID>&doc_reference_id=<DOC_REF_ID>" \
  --header "Authorization: Bearer <your-api-key>" \
  --header "Content-Type: application/json" \
  --data '{
    "message": "Please review and sign this document.",
    "data": [
      {
        "reference_signer_id": "<SIGNER_REF_ID>"
      }
    ]
  }'
```

For the full API reference with all available endpoints, see the [Developer API Keys Overview](api-keys-usage).

---

*Need help? Contact our support team at [support@skrivly.com](mailto:support@skrivly.com)*
