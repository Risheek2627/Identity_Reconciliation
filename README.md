# Identity Reconciliation API — Identity Controller

## Overview

This API endpoint handles identity reconciliation based on email and/or phone number input. It helps manage contacts by linking related contact records together, distinguishing between primary and secondary contacts, and ensuring no duplicate primary entries exist for the same identity.

The logic ensures that when new contacts are added with matching email or phone, they are linked as secondaries to an existing primary contact. It also fixes multiple primaries by consolidating to a single primary.

## How It Works

### Input

Accepts an HTTP POST request with JSON body containing:

- `email` (string, optional)
- `phoneNumber` (string, optional)

**Note:** At least one of `email` or `phoneNumber` must be provided.

### Output

Returns a JSON object describing:

- The primary contact ID
- List of all unique emails linked to this identity
- List of all unique phone numbers linked
- IDs of all secondary contacts linked to this primary

## Core Logic Flow

1. **Validate input:**
   - Ensure either email or phoneNumber is provided.

2. **Search existing contacts** in the database where:
   - email or phoneNumber matches, and
   - Contact is not deleted (deletedAt IS NULL).

3. **If no contacts found:**
   - Insert a new contact with linkPrecedence = 'primary'.
   - Return this newly created contact as the primary.

4. **If contacts exist:**
   - Extract all matched contacts.
   - Identify primary contacts (those with linkPrecedence === 'primary').

5. **Handle multiple primaries:**
   - If multiple primaries exist (which shouldn't normally happen), choose the earliest created as the "true" primary.
   - Update others to become secondaries linked to this primary.

6. **If no primary found but secondaries exist:**
   - Find a secondary contact.
   - Use its linkedId to find the corresponding primary contact.

7. **Check if the exact combination of email and phoneNumber exists:**
   - If not, insert a new contact as secondary linked to the primary contact.

8. **Fetch all contacts linked to the primary** (both primary and secondaries):
   - Gather unique emails and phone numbers.
   - Gather IDs of all secondaries.

9. **Return a structured JSON response** with this contact group info.

## Important Notes

### Primary vs Secondary

- **Primary contact** is the main identity record.
- **Secondary contacts** are linked records related to the primary (e.g., duplicate entries or variations).

### Linking

- Secondary contacts have a `linkedId` pointing to their primary.

### Data Integrity

- The code automatically fixes multiple primaries by promoting one and downgrading others.

### SQL Security

- Use parameterized queries with `?` placeholders to prevent SQL injection.

### Edge Cases

- If no matching primary is found but secondaries exist, the primary is found via the secondary's `linkedId`.
- Handles cases where input email/phone is new or partially matches.

## Example Response

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "user.secondary@example.com"],
    "phone_Number": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Usage

Send POST request with JSON body:

```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

Receive response as described above and integrate with frontend or other services needing identity reconciliation.

## Sample SQL Table Schema

```sql
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  phoneNumber VARCHAR(20),
  linkedId INT NULL,
  linkPrecedence ENUM('primary', 'secondary') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL
);
```

## Troubleshooting

### Undefined primary contact
Make sure to handle cases when no primary contact exists.

### SQL syntax errors
Double-check query strings and parameter counts.

### Multiple primaries detected
System automatically resolves by choosing earliest and updating others.
