import {Static, Type} from '@sinclair/typebox';

export const registerBodySchema = Type.Object({
  endpoint: Type.String(),
  keys: Type.Object({
    p256dh: Type.String(),
    auth: Type.String(),
  }, { additionalProperties: false }),
}, { additionalProperties: false });
export type RegisterBody = Static<typeof registerBodySchema>;
