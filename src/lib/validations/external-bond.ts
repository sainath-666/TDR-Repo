import { z } from 'zod';
import { DocumentType, RelationType } from '@prisma/client';

const ratioPattern = /^\d+(\.\d+)?:\d+(\.\d+)?$/;

/** Payload shape from the external APCRDA bond sync API */
export const externalBondHolderSchema = z.object({
  name: z.string().min(2),
  relationType: z.nativeEnum(RelationType),
  relationName: z.string().min(1),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  mobileNo: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  doorNo: z.string().min(1),
  street: z.string().min(1),
  village: z.string().min(1),
  mandal: z.string().min(1),
  district: z.string().min(1),
});

export const externalBondLandSchema = z.object({
  village: z.string().min(1),
  surveyNumber: z.string().min(1),
  ownershipDeedNo: z.string().optional(),
  surrenderedAreaSqYds: z.number().positive('Surrendered area must be in Sq Yards'),
  tdrIssuedExtentSqYds: z.number().positive('TDR extent must be in Sq Yards'),
  issuedRatio: z.string().regex(ratioPattern, 'Ratio must be authority-decided e.g. "1:1"'),
  tdrCertificateNumber: z.string().optional(),
});

export const externalBondDocumentSchema = z.object({
  docType: z.nativeEnum(DocumentType),
  fileName: z.string().min(1),
  ipfsCid: z.string().min(1),
  supabaseStoragePath: z.string().min(1),
  sha256Hash: z.string().min(1),
  fileSizeKb: z.number().int().positive(),
});

export const externalBondIngestSchema = z.object({
  tdrNumber: z.string().min(1),
  externalRefId: z.string().min(1).optional(),
  holder: externalBondHolderSchema,
  land: externalBondLandSchema,
  documents: z
    .array(externalBondDocumentSchema)
    .length(5, 'All 5 document categories are required from external API'),
});

export type ExternalBondIngest = z.infer<typeof externalBondIngestSchema>;
