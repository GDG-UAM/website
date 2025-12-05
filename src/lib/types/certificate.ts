export type CertificateData = {
  title: string;
  description?: string;
  type: "COURSE_COMPLETION" | "EVENT_ACHIEVEMENT" | "PARTICIPATION" | "VOLUNTEER";
  recipient: {
    name: string;
  };
  designId: string;
  // Use string for dates to serialization friendliness in props
  period?: {
    startDate?: string;
    endDate?: string;
  };
  signatures?: Array<{
    name?: string;
    role?: string;
    imageUrl?: string;
  }>;
  metadata?: {
    // Course completion
    instructors?: Array<{ name?: string; ref?: string }>;
    grade?: string;
    hours?: number;
    // Event achievement
    rank?: string;
    group?: string;
    // Participation
    role?: string;
  };
};
