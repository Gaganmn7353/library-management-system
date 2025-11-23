// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  MEMBER: 'member',
};

// Member statuses
export const MEMBER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

// Transaction statuses
export const TRANSACTION_STATUS = {
  ISSUED: 'issued',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
};

// Reservation statuses
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

// Reservation expiry (in hours) - 48 hours to collect after fulfillment
export const RESERVATION_EXPIRY_HOURS = 48;

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
  OTHER: 'other',
};

// Default loan period (in days)
export const DEFAULT_LOAN_PERIOD = {
  MEMBER: 14,
  FACULTY: 30,
  STUDENT: 14,
};

// Fine rates (per day)
export const FINE_RATE = {
  DEFAULT: 5.00, // ₹5.00 per day
  CURRENCY: 'INR',
};

// Maximum books per member
export const MAX_BOOKS_PER_MEMBER = 3;

// Maximum pending fine amount before blocking book issue (in INR)
export const MAX_PENDING_FINE = 500.00;

// Default loan period (in days)
export const LOAN_PERIOD_DAYS = 14;

// API Response Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    RETRIEVED: 'Resource retrieved successfully',
  },
  ERROR: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_EXISTS: 'User already exists',
    BOOK_NOT_AVAILABLE: 'Book is not available',
    MAX_BOOKS_REACHED: 'Maximum books limit reached',
    MEMBERSHIP_EXPIRED: 'Membership has expired',
    MEMBER_SUSPENDED: 'Member account is suspended',
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  PAYLOAD_TOO_LARGE: 413,
};

