const parse = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const build = (items, total, { page, limit }) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0
  }
});

module.exports = { parse, build };
