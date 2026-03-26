/**
 * Validation Utilities
 * 
 * Input validation for ride and request data
 */

import { config } from './config';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate ride offer data
 */
export function validateRideOffer(data: {
  from: string;
  to: string;
  departureTime: Date;
  capacity: number;
  notes?: string;
  customLocation?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate capacity
  if (data.capacity < config.constraints.minSeats) {
    errors.capacity = `Capacity must be at least ${config.constraints.minSeats}`;
  }
  if (data.capacity > config.constraints.maxSeats) {
    errors.capacity = `Capacity cannot exceed ${config.constraints.maxSeats}`;
  }
  
  // Validate departure time
  const now = new Date();
  const maxAdvance = new Date(now.getTime() + config.constraints.maxAdvanceBookingDays * 24 * 60 * 60 * 1000);
  
  if (data.departureTime <= now) {
    errors.departureTime = 'Departure time must be in the future';
  }
  
  if (data.departureTime > maxAdvance) {
    errors.departureTime = `Cannot book more than ${config.constraints.maxAdvanceBookingDays} days in advance`;
  }
  
  // Validate custom location if provided
  if (data.to === 'custom') {
    if (!data.customLocation || data.customLocation.trim().length < 3) {
      errors.customLocation = 'Custom location must be at least 3 characters';
    }
    if (data.customLocation && data.customLocation.length > 100) {
      errors.customLocation = 'Custom location must be less than 100 characters';
    }
  }
  
  // Validate notes length
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must be less than 500 characters';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate ride request data
 */
export function validateRideRequest(data: {
  from: string;
  to: string;
  neededBy: Date;
  flexibility: number;
  notes?: string;
  customLocation?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate needed by time
  const now = new Date();
  const maxAdvance = new Date(now.getTime() + config.constraints.maxAdvanceBookingDays * 24 * 60 * 60 * 1000);
  
  if (data.neededBy <= now) {
    errors.neededBy = 'Needed by time must be in the future';
  }
  
  if (data.neededBy > maxAdvance) {
    errors.neededBy = `Cannot request more than ${config.constraints.maxAdvanceBookingDays} days in advance`;
  }
  
  // Validate flexibility
  if (data.flexibility < 0) {
    errors.flexibility = 'Flexibility cannot be negative';
  }
  
  // Validate custom location if provided
  if (data.to === 'custom') {
    if (!data.customLocation || data.customLocation.trim().length < 3) {
      errors.customLocation = 'Custom location must be at least 3 characters';
    }
    if (data.customLocation && data.customLocation.length > 100) {
      errors.customLocation = 'Custom location must be less than 100 characters';
    }
  }
  
  // Validate notes length
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must be less than 500 characters';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}