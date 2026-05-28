# Mobile Dataset API

This is a beginner-friendly Node.js API server created from your uploaded **Mobiles Dataset (2025).csv** file.

The API is loaded with the dataset and can be tested in Postman.

## 1. Requirements

Install Node.js first.

Check Node version:

```bash
node -v
```

## 2. Run the server

Open terminal inside this folder and run:

```bash
npm start
```

or:

```bash
node server.js
```

Server will start on:

```text
http://localhost:5000
```

## 3. Test in Postman

Set request method to **GET**.

### Home route

```text
http://localhost:5000/
```

### Fetch all mobiles

```text
http://localhost:5000/api/mobiles
```

### Fetch first 5 mobiles

```text
http://localhost:5000/api/mobiles?limit=5
```

### Search mobile by keyword

```text
http://localhost:5000/api/mobiles?search=iphone
```

### Filter by company

```text
http://localhost:5000/api/mobiles?company=Apple
```

### Filter by RAM

```text
http://localhost:5000/api/mobiles?ram=6GB
```

### Filter by company and RAM

```text
http://localhost:5000/api/mobiles?company=Apple&ram=6GB&limit=5
```

### Filter by India price range

```text
http://localhost:5000/api/mobiles?minIndiaPrice=50000&maxIndiaPrice=100000&sort=priceIndiaAsc
```

### Fetch mobile by ID

```text
http://localhost:5000/api/mobiles/1
```

### Fetch company list

```text
http://localhost:5000/api/companies
```

### Fetch dataset stats

```text
http://localhost:5000/api/stats
```

## 4. Important query parameters

| Parameter | Example | Meaning |
|---|---|---|
| search | `?search=iphone` | Search in company, model, processor, RAM |
| company | `?company=Apple` | Filter by company name |
| ram | `?ram=6GB` | Filter by RAM |
| processor | `?processor=A17` | Filter by processor |
| year | `?year=2025` | Filter by launched year |
| minIndiaPrice | `?minIndiaPrice=50000` | Minimum India price |
| maxIndiaPrice | `?maxIndiaPrice=100000` | Maximum India price |
| sort | `?sort=priceIndiaAsc` | Sort result |
| page | `?page=2` | Page number |
| limit | `?limit=10` | Number of records per page |

## 5. Supported sort values

```text
priceIndiaAsc
priceIndiaDesc
yearAsc
yearDesc
company
model
```

## 6. API response format

```json
{
  "success": true,
  "message": "Mobiles fetched successfully",
  "page": 1,
  "limit": 20,
  "total": 743,
  "totalPages": 38,
  "data": []
}
```
