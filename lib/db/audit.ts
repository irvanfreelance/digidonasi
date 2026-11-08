import { dbQuery } from "@/lib/db";

export async function logAudit(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  fieldChanged?: string | null;
  valueBefore?: unknown;
  valueAfter?: unknown;
  source?: string;
}) {
  await dbQuery(
    `INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id, field_changed,
      value_before, value_after, source
    ) VALUES (
      $1, $2, $3, CASE WHEN $4 ~ '^[0-9]+$' THEN $4::bigint ELSE NULL END, $5, $6::jsonb, $7::jsonb, $8
    )`,
    [
      input.userId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.fieldChanged ?? null,
      JSON.stringify(input.valueBefore ?? null),
      JSON.stringify(input.valueAfter ?? null),
      input.source ?? "web_app",
    ],
  );
}
