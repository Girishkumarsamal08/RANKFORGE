import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.message || err);

  // --- Zod Validation Errors ---
  if (err instanceof ZodError) {
    // Extract the first human-readable issue message
    const firstIssue = err.issues[0];
    const friendlyMessage = firstIssue
      ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
      : 'Validation failed. Please check your input.';

    return res.status(400).json({
      message: friendlyMessage,
      errors: err.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  // --- Prisma Unique Constraint Errors (e.g. duplicate email) ---
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        message: `This ${target} is already in use. Please try another.`,
      });
    }
    // Foreign key constraint failure
    if (err.code === 'P2003') {
      return res.status(400).json({
        message: 'Referenced record not found. Please verify your input.',
      });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        message: 'The requested record was not found.',
      });
    }
  }

  // --- Prisma Validation / Connection errors ---
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      message: 'Invalid data provided. Please check your input fields.',
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      message: 'Database service is temporarily unavailable. Please try again shortly.',
    });
  }

  // --- Known application errors (thrown with new Error()) ---
  if (err.message === 'Email already in use') {
    return res.status(409).json({ message: 'This email is already registered. Please sign in instead.' });
  }

  if (err.message === 'Invalid email or password') {
    return res.status(401).json({ message: 'Invalid email or password. Please check your credentials.' });
  }

  if (err.message === 'Test attempt not found') {
    return res.status(404).json({ message: 'Test attempt not found. It may have expired.' });
  }

  if (err.message === 'Test already submitted') {
    return res.status(409).json({ message: 'This test has already been submitted.' });
  }

  // --- Fallback: Generic Internal Server Error ---
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred. Please try again.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
