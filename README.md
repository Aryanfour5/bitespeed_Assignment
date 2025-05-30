
---

# 🧠 BiteSpeed Identity Resolution API

This is a backend service built for the [BiteSpeed Identity Resolution Challenge](https://bitespeed.in). The API helps unify user identity by linking contacts with the same email or phone number across multiple records.

### 🚀 Hosted API:

**Base URL**: [`https://bitespeed-assignment-2u07.onrender.com`](https://bitespeed-assignment-2u07.onrender.com)

---

## 📘 Table of Contents

* [Tech Stack](#-tech-stack)
* [API Endpoints](#-api-endpoints)
* [Identity Resolution Logic](#-identity-resolution-logic)
* [How to Run Locally](#-how-to-run-locally)
* [Soft Delete & Restore Feature](#-soft-delete--restore-feature)
* [Database Schema](#-database-schema)
* [Swagger API Docs](#-swagger-api-docs)
* [Author](#-author)

---

## ⚙️ Tech Stack

* **Backend**: Node.js, Express.js
* **Database**: PostgreSQL (via Prisma ORM)
* **Deployment**: Render
* **API Docs**: Swagger (OpenAPI 3.0)

---

## 🔗 API Endpoints

### 1. `POST /identify`

* **Purpose**: Resolves identity based on email and/or phone number.
* **Body**:

```json
{
  "email": "john.doe@example.com",
  "phoneNumber": "9876543210"
}
```

* **Response**:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john.doe@example.com", "another@example.com"],
    "phoneNumbers": ["9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

### 2. `DELETE /identify/{id}`

* **Purpose**: Soft deletes the contact with given ID.
* **Response**:

```json
{
  "message": "Contact soft deleted",
  "contact": {
    "id": 11,
    "email": "john.doe@example.com",
    "phoneNumber": "9876543210",
    "linkPrecedence": "primary",
    "deletedAt": "timestamp"
  }
}
```

---

### 3. `PATCH /identify/restore/{id}`

* **Purpose**: Restores a soft-deleted contact.
* **Response**:

```json
{
  "message": "Contact restored",
  "contact": {
    "id": 11,
    "email": "john.doe@example.com",
    "phoneNumber": "9876543210",
    "linkPrecedence": "primary"
  }
}
```

---

## 🔍 Identity Resolution Logic

* A **primary** contact is created if neither email nor phone exists.
* If either matches an existing contact, a **secondary** contact is created or linked to the existing **primary**.
* All linked contacts are grouped by a `linkedId`, ensuring a unified identity across duplicates.
* Conflicts are resolved by assigning the **oldest contact** as `primary`.

---

## 💾 How to Run Locally

```bash
git clone https://github.com/yourusername/bitespeed-assignment.git
cd bitespeed-assignment
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Ensure `.env` is configured with:

```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>"
```

---

## 🗃️ Database Schema

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| id             | Integer   | Primary key                |
| phoneNumber    | String    | User's phone number        |
| email          | String    | User's email address       |
| linkedId       | Integer   | Link to primary contact    |
| linkPrecedence | Enum      | 'primary' or 'secondary'   |
| createdAt      | Timestamp | Auto-generated             |
| updatedAt      | Timestamp | Auto-generated             |
| deletedAt      | Timestamp | Nullable (for soft delete) |

---

## 🔄 Soft Delete & Restore Feature

* Contacts are **soft deleted** using a `deletedAt` timestamp.
* Deleted contacts can be restored using the `/identify/restore/{id}` endpoint.
* Identity resolution ignores soft-deleted contacts by default.

---

## 🧪 Swagger API Docs

You can explore the full API documentation via Swagger UI:

🔗 [`/api-docs`](https://bitespeed-assignment-2u07.onrender.com/api-docs)

---

## 👨‍💻 Author

**Aryan Bachute**
Full Stack Developer  | IEEE Treasurer


---


