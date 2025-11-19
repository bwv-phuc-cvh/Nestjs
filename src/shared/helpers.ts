import { randomInt } from 'crypto';
import { Prisma } from 'generated/prisma';

// Type Predicate
export function isUniqueConstraintPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function isNotFoundPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export function generateOTP(length: number): string {
  return randomInt(0, 10 ** length)
    .toString()
    .padStart(length, '0');
}
