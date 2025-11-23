/**
 * Reservation Helper Functions
 */

import { RESERVATION_EXPIRY_HOURS } from '../config/constants.js';

/**
 * Calculate expiry date for a fulfilled reservation
 * @param {Date|string} reservationDate - Date when reservation was fulfilled
 * @returns {Date} - Expiry date (reservationDate + 48 hours)
 */
export const calculateReservationExpiry = (reservationDate) => {
  const date = new Date(reservationDate);
  return new Date(date.getTime() + RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000);
};

/**
 * Check if a fulfilled reservation is expired
 * @param {Date|string} reservationDate - Date when reservation was fulfilled
 * @returns {boolean} - True if expired
 */
export const isReservationExpired = (reservationDate) => {
  const expiryDate = calculateReservationExpiry(reservationDate);
  return new Date() > expiryDate;
};

/**
 * Get hours remaining until reservation expiry
 * @param {Date|string} reservationDate - Date when reservation was fulfilled
 * @returns {number} - Hours remaining (0 if expired)
 */
export const getReservationHoursRemaining = (reservationDate) => {
  const expiryDate = calculateReservationExpiry(reservationDate);
  const now = new Date();
  
  if (now > expiryDate) {
    return 0;
  }
  
  return Math.ceil((expiryDate - now) / (1000 * 60 * 60));
};

