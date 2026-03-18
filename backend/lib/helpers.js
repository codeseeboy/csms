function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  randomId,
  nowIso,
};

