// Mobile Dataset API Server
// Run: node server.js
// Test in Postman: GET http://localhost:5000/api/mobiles

const http = require("http");
const { URL } = require("url");
const mobiles = require("./data/mobiles.json");

const PORT = process.env.PORT || 5000;

// Send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(data, null, 2));
}

// Error response
function notFound(res) {
  sendJSON(res, 404, {
    error: "Route not found",
  });
}

// Search helper
function contains(value, searchValue) {
  return String(value || "")
    .toLowerCase()
    .includes(String(searchValue || "").toLowerCase());
}

// Filter mobile data
function getMobilesWithFilters(query) {
  let result = [...mobiles];

  const search = query.get("search") || query.get("q");
  const company = query.get("company");
  const ram = query.get("ram");
  const processor = query.get("processor");
  const year = query.get("year");
  const minIndiaPrice = query.get("minIndiaPrice");
  const maxIndiaPrice = query.get("maxIndiaPrice");
  const sort = query.get("sort");

  if (search) {
    result = result.filter((phone) =>
      contains(phone.companyName, search) ||
      contains(phone.modelName, search) ||
      contains(phone.processor, search) ||
      contains(phone.ram, search)
    );
  }

  if (company) {
    result = result.filter((phone) => contains(phone.companyName, company));
  }

  if (ram) {
    result = result.filter((phone) => contains(phone.ram, ram));
  }

  if (processor) {
    result = result.filter((phone) => contains(phone.processor, processor));
  }

  if (year) {
    result = result.filter((phone) => phone.launchedYear === Number(year));
  }

  if (minIndiaPrice) {
    result = result.filter(
      (phone) => phone.launchedPriceNumeric.india >= Number(minIndiaPrice)
    );
  }

  if (maxIndiaPrice) {
    result = result.filter(
      (phone) => phone.launchedPriceNumeric.india <= Number(maxIndiaPrice)
    );
  }

  if (sort === "priceIndiaAsc") {
    result.sort(
      (a, b) => a.launchedPriceNumeric.india - b.launchedPriceNumeric.india
    );
  } else if (sort === "priceIndiaDesc") {
    result.sort(
      (a, b) => b.launchedPriceNumeric.india - a.launchedPriceNumeric.india
    );
  } else if (sort === "yearDesc") {
    result.sort((a, b) => b.launchedYear - a.launchedYear);
  } else if (sort === "yearAsc") {
    result.sort((a, b) => a.launchedYear - b.launchedYear);
  } else if (sort === "company") {
    result.sort((a, b) => a.companyName.localeCompare(b.companyName));
  } else if (sort === "model") {
    result.sort((a, b) => a.modelName.localeCompare(b.modelName));
  }

  return result;
}

// Limit data
function applyLimit(items, query) {
  const limit = Number(query.get("limit"));

  if (!limit || limit <= 0) {
    return items;
  }

  return items.slice(0, limit);
}

// Create server
const server = http.createServer((req, res) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, {});
  }

  // Allow only GET request
  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      error: "Only GET requests are allowed",
    });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Home route: only mobile data
  if (path === "/" || path === "/api") {
    return sendJSON(res, 200, mobiles);
  }

  // Get all mobiles with optional filters
  if (path === "/api/mobiles") {
    const filteredMobiles = getMobilesWithFilters(url.searchParams);
    const mobileDataOnly = applyLimit(filteredMobiles, url.searchParams);

    return sendJSON(res, 200, mobileDataOnly);
  }

  // Get single mobile by ID
  const singleMobileMatch = path.match(/^\/api\/mobiles\/(\d+)$/);

  if (singleMobileMatch) {
    const id = Number(singleMobileMatch[1]);
    const mobile = mobiles.find((phone) => phone.id === id);

    if (!mobile) {
      return sendJSON(res, 404, {
        error: `No mobile found with id ${id}`,
      });
    }

    return sendJSON(res, 200, mobile);
  }

  // Get companies only
  if (path === "/api/company" || path === "/api/companies") {
    const companyMap = mobiles.reduce((acc, phone) => {
      acc[phone.companyName] = (acc[phone.companyName] || 0) + 1;
      return acc;
    }, {});

    const companies = Object.entries(companyMap)
      .map(([companyName, totalModels]) => ({
        companyName,
        totalModels,
      }))
      .sort((a, b) => a.companyName.localeCompare(b.companyName));

    return sendJSON(res, 200, companies);
  }

  // Get stats only
  if (path === "/api/stats") {
    const years = [
      ...new Set(mobiles.map((phone) => phone.launchedYear).filter(Boolean)),
    ].sort();

    const companies = [
      ...new Set(mobiles.map((phone) => phone.companyName)),
    ].sort();

    const indiaPrices = mobiles
      .map((phone) => phone.launchedPriceNumeric.india)
      .filter((price) => Number.isFinite(price));

    const stats = {
      totalMobiles: mobiles.length,
      totalCompanies: companies.length,
      companies: companies,
      launchedYears: years,
      indiaPriceRange: {
        min: Math.min(...indiaPrices),
        max: Math.max(...indiaPrices),
      },
    };

    return sendJSON(res, 200, stats);
  }

  return notFound(res);
});

// Start server
server.listen(PORT, () => {
  console.log(`Mobile Dataset API running at http://localhost:${PORT}`);
  console.log(`Test in Postman: GET http://localhost:${PORT}/api/mobiles`);
});