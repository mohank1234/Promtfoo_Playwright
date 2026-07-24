// Fictional agent roster for the mock Cortex Assist API. Fixed IDs so the
// framework's config/environments/development.agents.json can reference
// them directly, mirroring how a real deployment's agent IDs are stable.
module.exports = {
  HR: { id: "1a2b3c4d-0001-4a11-8000-aaaaaaaaaaaa", name: "HR Agent" },
  LEGAL: { id: "1a2b3c4d-0002-4a11-8000-bbbbbbbbbbbb", name: "Legal Agent" },
  FINANCE: { id: "1a2b3c4d-0003-4a11-8000-cccccccccccc", name: "Finance Agent" },
  IT: { id: "1a2b3c4d-0004-4a11-8000-dddddddddddd", name: "IT Support Agent" },
  SALES: { id: "1a2b3c4d-0005-4a11-8000-eeeeeeeeeeee", name: "Sales Agent" },
  GENERAL: { id: "1a2b3c4d-0006-4a11-8000-ffffffffffff", name: "General Agent" },
};
