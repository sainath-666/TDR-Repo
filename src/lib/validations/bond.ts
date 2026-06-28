import { z } from 'zod';
import { RelationType, DocumentType } from '@prisma/client';

export const phase1Schema = z.object({
  tdrNumber: z.string().min(1, 'TDR number is required'),
  name: z.string().min(2, 'Name is required'),
  relationType: z.nativeEnum(RelationType),
  relationName: z.string().min(1, 'Relation name is required'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  aadhaarPhone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  doorNo: z.string().min(1),
  street: z.string().min(1),
  village: z.string().min(1),
  mandal: z.string().min(1),
  district: z.string().min(1),
});

export const phase2Schema = z.object({
  surrenderedVillage: z.string().min(1),
  surveyNumber: z.string().min(1),
  ownershipDeedNo: z.string().optional(),
  surrenderedAreaSqYds: z.number().positive('Area must be in Sq Yards and greater than 0'),
  tdrIssuedExtentSqYds: z.number().positive('TDR extent must be in Sq Yards and greater than 0'),
  issuedRatio: z
    .string()
    .regex(/^\d+(\.\d+)?:\d+(\.\d+)?$/, 'Ratio must be authority-decided format e.g. "1:1"'),
  tdrCertificateNumber: z.string().optional(),
  returnablePlotCode: z.string().optional(),
});

export const createBondSchema = phase1Schema;

export const updateDraftSchema = z.object({
  phase1: phase1Schema.partial().optional(),
  phase2: phase2Schema.partial().optional(),
});

export const documentUploadSchema = z.object({
  bondId: z.string().uuid(),
  docType: z.nativeEnum(DocumentType),
});

export const submitBondSchema = z.object({
  confirmSubmit: z.literal(true),
});

export const REQUIRED_DOCUMENT_TYPES = [
  DocumentType.OWNERSHIP_DOCUMENT,
  DocumentType.AADHAAR_COPY,
  DocumentType.RETURNABLE_PLOT_ALLOTMENT,
  DocumentType.TDR_ISSUED_COPY,
  DocumentType.INDIVIDUAL_SKETCH,
] as const;
