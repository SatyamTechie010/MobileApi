// Mobile Dataset API Server
// Run: node server.js
// Test in Postman: GET http://localhost:5000/api/mobiles

const http = require("http");
const { URL } = require("url");
const mobiles = require("./data/mobiles.json");

const PORT = process.env.PORT || 5000;

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data, null, 2));
}

function notFound(res) {
  sendJSON(res, 404, {
    success: false,
    message: "Route not found. Check the API endpoint URL.",
  });
}

function contains(value, searchValue) {
  return String(value || "").toLowerCase().includes(String(searchValue || "").toLowerCase());
}

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
    result = result.filter((phone) => phone.launchedPriceNumeric.india >= Number(minIndiaPrice));
  }

  if (maxIndiaPrice) {
    result = result.filter((phone) => phone.launchedPriceNumeric.india <= Number(maxIndiaPrice));
  }

  if (sort === "priceIndiaAsc") {
    result.sort((a, b) => a.launchedPriceNumeric.india - b.launchedPriceNumeric.india);
  } else if (sort === "priceIndiaDesc") {
    result.sort((a, b) => b.launchedPriceNumeric.india - a.launchedPriceNumeric.india);
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

function paginate(items, query) {
  const page = Math.max(Number(query.get("page")) || 1, 1);
  const limit = Math.max(Number(query.get("limit")) || 20, 1);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
    data: items.slice(startIndex, endIndex),
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { success: true });
  }

  if (req.method !== "GET") {
    return sendJSON(res, 405, {
      success: false,
      message: "Only GET requests are allowed in this API.",
    });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (path === "/" || path === "/api") {
    return sendJSON(res, 200, {
      success: true,
      message: "Welcome to Mobile Dataset API",
      dataset: "Mobiles Dataset 2025",
      totalMobiles: mobiles.length,
      endpoints: {
        allMobiles: "GET /api/mobiles",
        singleMobile: "GET /api/mobiles/:id",
        companies: "GET /api/companies",
        stats: "GET /api/stats",
        searchExample: "GET /api/mobiles?search=iphone",
        filterExample: "GET /api/mobiles?company=Apple&ram=6GB&limit=5",
        priceFilterExample: "GET /api/mobiles?minIndiaPrice=50000&maxIndiaPrice=100000&sort=priceIndiaAsc"
      }
    });
  }

  if (path === "/api/mobiles") {
    const filteredMobiles = getMobilesWithFilters(url.searchParams);
    const paginated = paginate(filteredMobiles, url.searchParams);

    return sendJSON(res, 200, {
      success: true,
      message: "Mobiles fetched successfully",
      filters: Object.fromEntries(url.searchParams.entries()),
      ...paginated
    });
  }

  const singleMobileMatch = path.match(/^\/api\/mobiles\/(\d+)$/);
  if (singleMobileMatch) {
    const id = Number(singleMobileMatch[1]);
    const mobile = mobiles.find((phone) => phone.id === id);

    if (!mobile) {
      return sendJSON(res, 404, {
        success: false,
        message: `No mobile found with id ${id}`
      });
    }

    return sendJSON(res, 200, {
      success: true,
      message: "Mobile fetched successfully",
      data: mobile
    });
  }

  if (path === "/api/company") {
    const companyMap = mobiles.reduce((acc, phone) => {
      acc[phone.companyName] = (acc[phone.companyName] || 0) + 1;
      return acc;
    }, {});

    const companies = Object.entries(companyMap)
      .map(([companyName, totalModels]) => ({ companyName, totalModels }))
      .sort((a, b) => a.companyName.localeCompare(b.companyName));

    return sendJSON(res, 200, {
      success: true,
      totalCompanies: companies.length,
      data: companies
    });
  }

  if (path === "/api/stats") {
    const years = [...new Set(mobiles.map((phone) => phone.launchedYear).filter(Boolean))].sort();
    const companies = [...new Set(mobiles.map((phone) => phone.companyName))].sort();
    const indiaPrices = mobiles
      .map((phone) => phone.launchedPriceNumeric.india)
      .filter((price) => Number.isFinite(price));

    return sendJSON(res, 200, {
      success: true,
      totalMobiles: mobiles.length,
      totalCompanies: companies.length,
      companies,
      launchedYears: years,
      indiaPriceRange: {
        min: Math.min(...indiaPrices),
        max: Math.max(...indiaPrices)
      }
    });
  }

  return notFound(res);
});

server.listen(PORT, () => {
  console.log(`✅ Mobile Dataset API running at http://localhost:${PORT}`);
  console.log(`📌 Test in Postman: GET http://localhost:${PORT}/api/mobiles`);
});
