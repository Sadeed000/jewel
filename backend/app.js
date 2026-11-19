// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const compression = require('compression');
// const cookieParser = require('cookie-parser');
// const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');

// const routes = require('./routes');
// const errorHandler = require('./middlewares/errorHandler');
// const notFound = require('./middlewares/notFound');

// const app = express();

// /* ───────────── Trust proxy ─────────────
//    Required when running behind a reverse proxy (nginx, Heroku, Render)
//    so req.ip / rate-limit / secure-cookies work correctly. */
// app.set('trust proxy', 1);

// /* ───────────── Security ───────────── */
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: 'cross-origin' },
//   })
// );

// /* ───────────── CORS ─────────────
//    Allow only origins listed in CORS_ORIGINS env var. Credentials enabled
//    so the Next.js client can send the jwt cookie if cookie-based auth
//    is used. */
// /* ───────────── CORS ───────────── */
// app.use(
//   cors({
//     // Reflect the requesting origin, allowing all origins.
//     // This also works with credentials: true.
//     origin: true,
//     credentials: true,
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: [
//       'Content-Type',
//       'Authorization',
//       'X-Requested-With',
//       'Accept',
//       'Origin',
//     ],
//   })
// );

// // Handle preflight requests
// app.options(/.*/, cors());

// // In development, allow any localhost/127.0.0.1 origin regardless of port,
// // so the Next.js dev server works even when it falls back to :3001, :3002, etc.
// const isLocalhost = (origin) =>
//   /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (server-to-server, curl, mobile apps)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) return callback(null, true);
//       if (process.env.NODE_ENV !== 'production' && isLocalhost(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error(`CORS: Origin ${origin} not allowed`));
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   })
// );

// /* ───────────── Body parsing ───────────── */
// app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.use(cookieParser());

// /* ───────────── Sanitization ─────────────
//    Strip any keys starting with $ or containing . from req.body, query, params
//    to prevent NoSQL injection. */
// app.use(mongoSanitize());

// /* ───────────── Compression ───────────── */
// app.use(compression());

// /* ───────────── Logging ───────────── */
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// /* ───────────── Global rate limit ─────────────
//    Tighter limiters live on /auth and /contact; this is the safety net. */
// const globalLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { status: 'fail', message: 'Too many requests. Please slow down.' },
// });

// const apiPrefix = process.env.API_PREFIX || '/api/v1';
// app.use(apiPrefix, globalLimiter, routes);

// /* ───────────── Root ───────────── */
// app.get('/', (req, res) => {
//   res.json({
//     name: 'Aurelia Backend API',
//     version: '1.0.0',
//     docs: `${apiPrefix}/health`,
//   });
// });

// /* ───────────── Error handling ─────────────
//    Must be registered LAST, after all routes. */
// app.use(notFound);
// app.use(errorHandler);

// module.exports = app;



const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const { UPLOAD_DIR } = require('./middlewares/upload');

const app = express();

/* Comma-separated allow-list, e.g. CORS_ORIGINS=https://aurelia.in,https://www.aurelia.in
   When unset, every origin is reflected (the previous behaviour) so existing
   deployments keep working; set it in production to lock the API down. */
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

/* ───────────── Trust proxy ───────────── */
app.set('trust proxy', 1);

/* ───────────── Security ───────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
    crossOriginOpenerPolicy: false,
  })
);

/* ───────────── CORS ─────────────
   Allow requests from all origins.
   The requesting origin will be reflected in the response header.
*/
const corsOptions = {
  origin(origin, callback) {
    // No Origin header: server-to-server, curl, Postman, mobile apps.
    if (!origin || allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && isLocalhost(origin)) return callback(null, true);
    // Deny without throwing: the browser blocks the response, the server stays quiet.
    return callback(null, false);
  },

  credentials: true,

  methods: [
    'GET',
    
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],

  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Authorization',
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/* Handle all preflight OPTIONS requests */
app.options(/.*/, cors(corsOptions));

/* ───────────── Body parsing ─────────────
   `verify` keeps the exact request bytes on req.rawBody: the Razorpay webhook
   signature is an HMAC over those bytes, and re-serialising the parsed JSON
   would not reproduce them. */
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(cookieParser());

/* ───────────── Sanitization ───────────── */
app.use(mongoSanitize());

/* ───────────── Compression ───────────── */
app.use(compression());

/* ───────────── Logging ───────────── */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ───────────── Rate limiting ───────────── */
const globalLimiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) ||
    15 * 60 * 1000,

  max:
    parseInt(process.env.RATE_LIMIT_MAX, 10) ||
    300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    status: 'fail',
    message: 'Too many requests. Please slow down.',
  },
});

/* ───────────── Uploaded files ─────────────
   Served before the rate limiter: a product page pulls many images at once
   and would otherwise burn through the API quota. */
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    maxAge: '30d',
    // Never let an uploaded file be interpreted as markup.
    setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
  })
);

/* ───────────── Routes ───────────── */
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(apiPrefix, globalLimiter, routes);

/* ───────────── Root route ───────────── */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    name: 'Aurelia Backend API',
    version: '1.0.0',
    docs: `${apiPrefix}/health`,
  });
});

/* ───────────── Error handling ───────────── */
app.use(notFound);
app.use(errorHandler);

module.exports = app;