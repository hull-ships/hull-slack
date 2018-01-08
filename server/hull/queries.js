const name = query => ({
  query: {
    multi_match: {
      query,
      fields: ["name", "name.exact"],
      fuzziness: "AUTO"
    }
  },
  sort: {
    created_at: "asc"
  },
  raw: true,
  page: 1,
  per_page: 1
});
const id = query => ({
  filter: {
    filtered: {
      query: { match_all: {} },
      filter: { and: { filters: [{ terms: { id: [query] } }] } }
    }
  },
  sort: {
    created_at: "asc"
  },
  raw: true,
  page: 1,
  per_page: 1
});
const email = query => ({
  query: {
    multi_match: {
      type: "phrase_prefix",
      query,
      operator: "and",
      fields: ["email.exact^2"]
    }
  },
  sort: {
    created_at: "asc"
  },
  raw: true,
  page: 1,
  per_page: 1
});

const domain = query => ({
  query: { match_all: {} },
  filter: {
    and: {
      filters: [
        {
          or: {
            filters: [
              { prefix: { domain: query } },
              { prefix: { "domain.exact": query } }
            ]
          }
        }
      ]
    }
  },
  sort: {
    created_at: "asc"
  },
  raw: true,
  page: 1,
  per_page: 1
});

const events = userId => ({
  filter: {
    has_parent: {
      type: "user_report",
      query: { match: { id: userId } }
    }
  },
  sort: { created_at: "desc" },
  raw: true,
  page: 1,
  per_page: 15
});
const filteredEvents = (userId, event) => {
  const must = [
    {
      has_parent: {
        type: "user_report",
        query: {
          match: { id: userId }
        }
      }
    }
  ];
  if (event) must.push({ term: { event } });
  return {
    filter: { bool: { must } },
    sort: { created_at: "desc" },
    raw: true,
    page: 1,
    per_page: 10
  };
};
const eventId = i => ({
  filter: {
    ids: {
      values: [i],
      type: "event"
    }
  },
  sort: {
    created_at: "desc"
  },
  raw: true,
  page: 1,
  per_page: 100
});

module.exports = { domain, name, email, id, eventId, events, filteredEvents };
