import { t } from "elysia";

const CarouselElementSchema = t.Recursive((self) =>
  t.Object({
    id: t.String(),
    type: t.Union([
      t.Literal("container"),
      t.Literal("text"),
      t.Literal("qr"),
      t.Literal("image"),
      t.Literal("spacer")
    ]),
    props: t.Object({
      content: t.Optional(t.Nullable(t.String())),
      variant: t.Optional(
        t.Nullable(t.Union([t.Literal("h1"), t.Literal("h2"), t.Literal("h3"), t.Literal("body")]))
      ),
      color: t.Optional(t.Nullable(t.String())),
      align: t.Optional(
        t.Nullable(t.Union([t.Literal("left"), t.Literal("center"), t.Literal("right")]))
      ),
      fontSize: t.Optional(t.Nullable(t.String())),
      fontWeight: t.Optional(t.Nullable(t.String())),
      direction: t.Optional(t.Nullable(t.Union([t.Literal("row"), t.Literal("column")]))),
      gap: t.Optional(t.Nullable(t.Number())),
      alignItems: t.Optional(
        t.Nullable(
          t.Union([
            t.Literal("flex-start"),
            t.Literal("center"),
            t.Literal("flex-end"),
            t.Literal("stretch")
          ])
        )
      ),
      justifyContent: t.Optional(
        t.Nullable(
          t.Union([
            t.Literal("flex-start"),
            t.Literal("center"),
            t.Literal("flex-end"),
            t.Literal("space-between"),
            t.Literal("space-around")
          ])
        )
      ),
      flex: t.Optional(t.Nullable(t.Number())),
      padding: t.Optional(t.Nullable(t.String())),
      value: t.Optional(t.Nullable(t.String())),
      size: t.Optional(t.Nullable(t.Number())),
      cornerSize: t.Optional(t.Nullable(t.Number())),
      cornerColor: t.Optional(t.Nullable(t.String())),
      logoUrl: t.Optional(t.Nullable(t.String())),
      logoSize: t.Optional(t.Nullable(t.Number())),
      url: t.Optional(t.Nullable(t.String())),
      alt: t.Optional(t.Nullable(t.String())),
      height: t.Optional(t.Nullable(t.String())),
      width: t.Optional(t.Nullable(t.String())),
      objectFit: t.Optional(t.Nullable(t.Union([t.Literal("contain"), t.Literal("cover")]))),
      grow: t.Optional(t.Nullable(t.Number())),
      heightPx: t.Optional(t.Nullable(t.Number())),
      widthPx: t.Optional(t.Nullable(t.Number()))
    }),
    children: t.Optional(t.Nullable(t.Array(self)))
  })
);

export const AdminHackathonIntermission = t.Object({
  organizerLogoUrl: t.Optional(t.Nullable(t.String())),
  schedule: t.Array(
    t.Object({
      startTime: t.String(),
      endTime: t.Optional(t.Nullable(t.String())),
      title: t.String()
    })
  ),
  carousel: t.Array(
    t.Object({
      id: t.String(),
      duration: t.Number(),
      root: CarouselElementSchema,
      label: t.Optional(t.Nullable(t.String()))
    })
  ),
  sponsors: t.Array(
    t.Object({
      name: t.String(),
      logoUrl: t.String(),
      tier: t.Number()
    })
  )
});

export const AdminHackathonItem = t.Object({
  _id: t.Any(), // ObjectId
  title: t.String(),
  date: t.Any(), // Date or string
  endDate: t.Any(), // Date or string
  location: t.Optional(t.Nullable(t.String())),
  intermission: t.Optional(t.Nullable(AdminHackathonIntermission)),
  createdAt: t.Any(),
  updatedAt: t.Any()
});

export const AdminHackathonsListResponse = t.Object({
  items: t.Array(AdminHackathonItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const AdminCreateHackathonBody = t.Object({
  title: t.String(),
  date: t.Union([t.String(), t.Date()]),
  endDate: t.Union([t.String(), t.Date()]),
  location: t.Optional(t.Nullable(t.String())),
  intermission: t.Optional(t.Nullable(AdminHackathonIntermission))
});

export const AdminUpdateHackathonBody = t.Partial(AdminCreateHackathonBody);
