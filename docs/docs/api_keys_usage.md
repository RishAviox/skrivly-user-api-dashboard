---
id: api-keys-usage
title: Developer API Keys Overview
sidebar_position: 3
---

# Developer API Keys Overview

### What Are Developer API Keys?

Developer API Keys allow you to programmatically interact with your organization’s documents, signers, and workflows without needing a JWT token. They provide full access to the Send Documents Flow APIs, enabling automation of document management, signature collection, and activity tracking.

**With a Developer API Key, you can:**
- Send documents for e-signature or BankID signature
- Retrieve document details by reference ID
- Add signers to documents and update signer status
- Send reminders and resend signed documents

:::info Note
All actions performed using API keys are automatically tracked for billing and usage reporting.
:::

---

## Authentication

To use your Developer API Key:

```http
Authorization: Bearer ${API_KEY}
```

:::tip Implementation Notes
- Replace `${API_KEY}` with your actual key from the dashboard.
:::

---

## Key Capabilities

| Feature | Description |
| :--- | :--- |
| **Send Documents** | Send documents via email with e-signature or BankID signature support |
| **Retrieve Documents** | Get details of specific documents by reference ID |
| **Manage Signers** | Add signers to documents and update signer status |
| **Reminders & Resend** | Send reminders to pending signers and resend signed documents |
| **Automatic Billing** | API calls are tracked to calculate usage costs |

---

## How to Use Developer API Keys

### 1. Generate API Key
1. Log into your organization dashboard
2. Navigate to the **Developer API Keys** section
3. Click **Generate API Key**

### 2. Include in API Requests
Use the `Authorization: Bearer ${API_KEY}` header.

**Example:**
```bash
curl -X GET "${BASE_URL}/user-documents/details/?document_organisation_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}"
```

### 3. Perform Actions

- Get your organisation reference ID
- Create and upload documents
- Send documents for signing
- Retrieve document details and manage signers
- Send reminders and resend signed documents

### 4. Track Usage & Billing
API calls are automatically tracked to calculate your usage costs.

**API Charging Update:**
We apply charges in two distinct stages:
- **$0.12** when the document is initially sent to signers.
- **$0.15** per E-Signature × total number of signed documents.
- **$0.35** per Bank-ID signature × total number of signed documents.

:::note Billing Enforcement
Signature charges (E-Signature and Bank-ID) are applied **only after the document is successfully signed** by the recipient. They are not added at the time of document creation or sending.
:::

---

## Process Flow

```mermaid
graph LR
    A[Dashboard] -->|Generate| B(API Key)
    B -->|Bearer Auth| C[Get Org Reference]
    C --> D[Create Document]
    D --> E[Add Signers]
    E --> F[Send for Signing]
    F --> G[Usage Logged]
    G --> H[Billing]
```

---

## Sending Documents via API

This guide shows how to send documents for signature using Developer API Keys. The complete workflow involves four steps: getting your organisation reference, creating a document, adding signers, and sending for signing.

All examples assume you have your API key:

```bash
export API_KEY="your_developer_api_key_here"
export BASE_URL="http://localhost:8000/en/api/v1"
```

### Step 1: Get Organisation Reference ID

- **Endpoint:** `GET /api/v1/developer-settings/profile/organization/`
- **Purpose:** Retrieve your organisation's `encrypted_reference_id`, which is required to create documents.

```bash
curl --location "${BASE_URL}/developer-settings/profile/organization/" \
  --header "Authorization: Bearer ${API_KEY}"
```

**Example Response:**

```json
{
  "encrypted_reference_id": "gAAAAABppdYi..."
}
```

:::note
The `encrypted_reference_id` from this response is required for the next step (creating a document). Store it securely for use in subsequent API calls.
:::

---

### Step 2: Create a Document

- **Endpoint:** `POST /api/v1/user-documents/details/`
- **Content-Type:** `multipart/form-data`
- **Purpose:** Upload a PDF document to your organisation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Document title |
| `encrypted_reference_id` | string | Yes | Your organization’s encrypted reference ID |
| `document_file` | file | Yes | The PDF file to upload |
| `latest_document_file` | file | Yes | Same PDF file (must be provided separately) |

:::warning IMPORTANT
Both `document_file` and `latest_document_file` must be provided. Send the same file for both fields.
:::

```bash
curl --location "${BASE_URL}/user-documents/details/" \
  --header "Authorization: Bearer ${API_KEY}" \
  --form ‘title="Sales Contract"’ \
  --form ‘encrypted_reference_id="<your_org_encrypted_reference_id>"’ \
  --form ‘document_file=@"/path/to/document.pdf"’ \
  --form ‘latest_document_file=@"/path/to/document.pdf"’
```

**Example Response:**

```json
{
  "status": "success",
  "action": "data_created",
  "message": "Document Created Successfully",
  "data": {
    "id": "98d0c99f-e6a7-49fc-a5ff-63a9bfcb482c",
    "reference_id": "gAAAAABpqcgx...",
    "title": "Sales Contract",
    "status": "draft",
    "organization_document_encrypted_reference_id": "gAAAAABpqcg1..."
  }
}
```

:::warning Save These Values
Save from the response for subsequent API calls:
- `reference_id` → **DOC_REF_ID**
- `organization_document_encrypted_reference_id` → **ORG_DOC_REF_ID**
:::

---

### Step 3: Add Signers

- **Endpoint:** `POST /api/v1/user-documents/details/signers/`
- **Content-Type:** `application/json`
- **Purpose:** Add one or more signers to the document.

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `organisation_doc_reference_id` | Yes | `ORG_DOC_REF_ID` from Step 2 |
| `doc_reference_id` | Yes | `DOC_REF_ID` from Step 2 |

**Request Body** (array of signer objects):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Signer’s email address |
| `name` | string | Yes | Signer’s full name |
| `signer_type` | string | No | Signature method: `default`, `sweden_bank_id`, `email`, `otp`. Default: `default` |
| `role` | string | No | `signer` (default) or `approver` |
| `phone_number` | string | No | Signer’s phone number (enables SMS notification) |
| `company_name` | string | No | Signer’s company name |
| `company_address` | string | No | Signer’s company address |
| `is_name_editable` | boolean | No | Allow signer to edit their name. Default: `false` |
| `hide_security_number` | boolean | No | Hide security number. Default: `false` |

```bash
curl --location "${BASE_URL}/user-documents/details/signers/?organisation_doc_reference_id=<ORG_DOC_REF_ID>&doc_reference_id=<DOC_REF_ID>" \
  --header "Authorization: Bearer ${API_KEY}" \
  --header "Content-Type: application/json" \
  --data ‘[
    {
      "email": "john@example.com",
      "name": "John Doe",
      "signer_type": "default",
      "phone_number": "+46701234567"
    },
    {
      "email": "jane@example.com",
      "name": "Jane Smith",
      "signer_type": "sweden_bank_id",
      "phone_number": "+46709876543"
    }
  ]’
```

**Example Response:**

```json
{
  "status": "success",
  "action": "data_created",
  "data": {
    "created": [
      {
        "id": "a1b2c3d4-...",
        "reference_signer_id": "gAAAAABpqcsY...",
        "email": "john@example.com",
        "name": "John Doe",
        "signer_type": "default",
        "role": "signer",
        "status": "pending"
      },
      {
        "id": "e5f6g7h8-...",
        "reference_signer_id": "gAAAAABpqcsZ...",
        "email": "jane@example.com",
        "name": "Jane Smith",
        "signer_type": "sweden_bank_id",
        "role": "signer",
        "status": "pending"
      }
    ],
    "existed": []
  }
}
```

:::warning Save Signer References
Save the `reference_signer_id` for each signer — you’ll need them in Step 4.
:::

---

### Step 4: Send for Signing

- **Endpoint:** `POST /api/v1/user-documents/send-mail/`
- **Content-Type:** `application/json`
- **Purpose:** Send email notifications to all signers.

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `organisation_doc_reference_id` | Yes | `ORG_DOC_REF_ID` from Step 2 |
| `doc_reference_id` | Yes | `DOC_REF_ID` from Step 2 |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | No | Custom message included in the signing email |
| `data` | array | Yes | Array of signer references (see below) |
| `external_links` | array | No | External links to attach `[{"name": "...", "value": "..."}]` |

Each object in the `data` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reference_signer_id` | string | Yes | Signer’s `reference_signer_id` from Step 3 |
| `signature_type` | string | No | Signature type for this signer |

```bash
curl --location "${BASE_URL}/user-documents/send-mail/?organisation_doc_reference_id=<ORG_DOC_REF_ID>&doc_reference_id=<DOC_REF_ID>" \
  --header "Authorization: Bearer ${API_KEY}" \
  --header "Content-Type: application/json" \
  --data ‘{
    "message": "Please review and sign this document.",
    "data": [
      {
        "reference_signer_id": "<SIGNER_1_REF_ID>"
      },
      {
        "reference_signer_id": "<SIGNER_2_REF_ID>"
      }
    ]
  }’
```

**Example Response:**

```json
{
  "status": "success",
  "action": "data_retrieved",
  "message": "Email sent successfully to the signer."
}
```

---

### 5. Update Signer Status

- **Endpoint:** `PATCH /api/v1/user-documents/sign/<reference_id>/documents/`
- **Purpose:** Mark a signer as having signed.

```bash
curl -X PATCH "${BASE_URL}/user-documents/sign/doc-456/documents/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d ‘{
    "status": "signed",
    "signer_reference_id": "signer-789"
  }’
```

---

### 6. Send Reminder to Signers

- **Endpoint:** `POST /api/v1/user-documents/document-reminder/`
- **Purpose:** Remind signers to sign pending documents.

```bash
curl -X POST "${BASE_URL}/user-documents/document-reminder/?organization_doc_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d ‘{
    "message": "Please remember to sign the document"
  }’
```

---

### 7. Retrieve Document Details

- **Endpoint:** `GET /api/v1/user-documents/details/`
- **Purpose:** Get the details of a specific document.

```bash
curl -X GET "${BASE_URL}/user-documents/details/?document_organisation_reference_id=org-doc-123" \
  -H "Authorization: Bearer ${API_KEY}"
```

:::note Parameters

- `document_organisation_reference_id` (required) – The organization document reference ID

:::

---

### 8. Resend Signed Document

- **Endpoint:** `POST /api/v1/user-documents/documents/resend-signed/`
- **Purpose:** Resend the completed document via email.

```bash
curl -X POST "${BASE_URL}/user-documents/documents/resend-signed/" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d ‘{
    "doc_reference_id": "doc-456",
    "organisation_doc_reference_id": "org-doc-123"
  }’
```

---

### Tips for Developers

:::tip Developer Best Practices
- Always keep `API_KEY` secret.
- All reference IDs are encrypted tokens. Treat them as opaque strings — do not modify or decode them.
- Document status changes from `draft` to `sent` after Step 3.
- Each signer can only be added once per document (duplicate emails are rejected).
- Signers receive an email with a link to review and sign the document.
- Track status via the **Retrieve Document Details** endpoint.
:::