/**
 * Recursively cleans objects of keys starting with '$' or containing '.' (NoSQL operator injection defense)
 */
function sanitizeMongoOperators(target, seen = new WeakSet()) {
  if (!target || typeof target !== 'object') return target;
  if (seen.has(target)) return target;
  seen.add(target);

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeMongoOperators(item, seen));
  }

  const clean = {};
  for (const [key, value] of Object.entries(target)) {
    // If key contains '$' or '.', skip or replace it
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[Security] Stripped potential NoSQL injection key: "${key}"`);
      continue;
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = sanitizeMongoOperators(value, seen);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Strips script tags, onerror/onload event handlers, and javascript: pseudo-protocols from strings
 */
function sanitizeXssString(str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:[^"']*/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '');
}

/**
 * Recursively sanitize XSS vulnerabilities across payload values
 */
function sanitizeXssPayload(target, seen = new WeakSet()) {
  if (!target) return target;

  if (typeof target === 'string') {
    return sanitizeXssString(target);
  }

  if (typeof target !== 'object') return target;
  if (seen.has(target)) return target;
  seen.add(target);

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeXssPayload(item, seen));
  }

  if (typeof target === 'object' && !(target instanceof Date)) {
    const clean = {};
    for (const [k, v] of Object.entries(target)) {
      clean[k] = sanitizeXssPayload(v, seen);
    }
    return clean;
  }

  return target;
}

/**
 * Unified Sanitization Middleware for Express
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeXssPayload(sanitizeMongoOperators(req.body));
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeXssPayload(sanitizeMongoOperators(req.query));
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeXssPayload(sanitizeMongoOperators(req.params));
  }
  if (typeof next === 'function') {
    next();
  }
};

module.exports = {
  sanitizeMiddleware,
  sanitizeMongoOperators,
  sanitizeXssPayload,
};
