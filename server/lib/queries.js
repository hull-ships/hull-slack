function name(query) {
  return {
    query: {
      multi_match: {
        type: "cross_fields",
        query,
        operator: "and",
        fields: ["first_name", "last_name"]
      }
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}
function id(query) {
  return {
    query: {
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
  };
}

function email(query) {
  return {
    query: {
      multi_match: {
        type: "phrase_prefix",
        query,
        operator: "and",
        fields: ["email", "email.exact^2"]
      }
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}

module.exports = { name, email, id };
