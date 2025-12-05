import { t } from "elysia";

// Certificate types enum
export const CertificateTypeEnum = t.Union([
  t.Literal("COURSE_COMPLETION"),
  t.Literal("EVENT_ACHIEVEMENT"),
  t.Literal("PARTICIPATION"),
  t.Literal("VOLUNTEER")
]);

export const ParticipationRoleEnum = t.Union([
  t.Literal("ATTENDEE"),
  t.Literal("PARTICIPANT"),
  t.Literal("SPEAKER"),
  t.Literal("ORGANIZER")
]);

// Sub-document schemas
export const RecipientSchema = t.Object({
  userId: t.Optional(t.Any()), // ObjectId
  name: t.String()
});

export const SignatureSchema = t.Object({
  name: t.Optional(t.String()),
  role: t.Optional(t.String()),
  imageUrl: t.Optional(t.String())
});

export const PeriodSchema = t.Object({
  startDate: t.Date(),
  endDate: t.Optional(t.Date())
});

export const RevokedSchema = t.Object({
  isRevoked: t.Boolean(),
  reason: t.Optional(t.String()),
  revokedAt: t.Optional(t.Date())
});

// Metadata schemas for each certificate type
export const CourseCompletionMetadataSchema = t.Object({
  instructors: t.Optional(
    t.Array(
      t.Object({
        ref: t.Optional(t.Any()), // ObjectId
        name: t.Optional(t.String())
      })
    )
  ),
  grade: t.Optional(t.String()),
  hours: t.Optional(t.Number())
});

export const EventAchievementMetadataSchema = t.Object({
  rank: t.String(),
  group: t.Optional(t.String())
});

export const ParticipationMetadataSchema = t.Object({
  role: ParticipationRoleEnum
});

export const VolunteerMetadataSchema = t.Object({
  hours: t.Number()
});

// Combined metadata schema (union of all types)
export const CertificateMetadataSchema = t.Optional(
  t.Union([
    CourseCompletionMetadataSchema,
    EventAchievementMetadataSchema,
    ParticipationMetadataSchema,
    VolunteerMetadataSchema
  ])
);

// Full certificate item schema
export const CertificateItem = t.Object({
  _id: t.Any(), // ObjectId
  publicId: t.String(),
  recipient: RecipientSchema,
  designId: t.String(),
  signatures: t.Optional(t.Array(SignatureSchema)),
  period: t.Optional(PeriodSchema),
  title: t.String(),
  description: t.Optional(t.String()),
  type: CertificateTypeEnum,
  metadata: t.Optional(t.Any()), // Type-specific metadata
  revoked: t.Optional(RevokedSchema),
  version: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

// Input body for creating/updating certificates
export const CertificateInputBody = t.Object({
  recipient: t.Object({
    userId: t.Optional(t.String()),
    name: t.String()
  }),
  designId: t.String(),
  signatures: t.Optional(
    t.Array(
      t.Object({
        name: t.Optional(t.String()),
        role: t.Optional(t.String()),
        imageUrl: t.Optional(t.String())
      })
    )
  ),
  period: t.Optional(
    t.Object({
      startDate: t.String(), // ISO date string
      endDate: t.Optional(t.String())
    })
  ),
  title: t.String(),
  description: t.Optional(t.String()),
  type: CertificateTypeEnum,
  metadata: t.Optional(t.Any()) // Type-specific metadata
});

// Update body (partial)
export const CertificateUpdateBody = t.Object({
  recipient: t.Optional(
    t.Object({
      userId: t.Optional(t.String()),
      name: t.Optional(t.String())
    })
  ),
  designId: t.Optional(t.String()),
  signatures: t.Optional(
    t.Array(
      t.Object({
        name: t.Optional(t.String()),
        role: t.Optional(t.String()),
        imageUrl: t.Optional(t.String())
      })
    )
  ),
  period: t.Optional(
    t.Object({
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String())
    })
  ),
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  metadata: t.Optional(t.Any()),
  revoke: t.Optional(
    t.Object({
      isRevoked: t.Boolean(),
      reason: t.Optional(t.String())
    })
  )
});

// Response schemas
export const CertificatesListResponse = t.Object({
  items: t.Array(CertificateItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const CertificateVerifyResponse = t.Object({
  valid: t.Boolean(),
  certificate: t.Optional(t.Nullable(CertificateItem)),
  revokedReason: t.Optional(t.String())
});
