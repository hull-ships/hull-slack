function name(query) {
  return {
    filter: {
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
  };
}
function id(query) {
  return {
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
  };
}
function email(query) {
  return {
    filter: {
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
function events(user_id) {
  return {
    filter: {
      has_parent: {
        type: "user_report",
        query: { match: { id: user_id } }
      }
    },
    sort: { created_at: "desc" },
    raw: true,
    page: 1,
    per_page: 25
  };
}
function filteredEvents(user_id, event) {
  const must = [{
    has_parent: {
      type: "user_report",
      query: {
        match: { id: user_id }
      }
    }
  }];
  if (event) must.push({ term: { event } });
  return {
    filter: { bool: { must } },
    sort: { created_at: "desc" },
    raw: true,
    page: 1,
    per_page: 10
  };
}
function eventId(i) {
  return {
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
  };
}
module.exports = { name, email, id, eventId, events, filteredEvents };
