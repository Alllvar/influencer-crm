import { Schema, model, Types } from 'mongoose';

// One document per active refresh token (one per logged-in device).
// The token itself is never stored: only its unique id (jti), so a database leak gives no usable tokens.
const sessionSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  jti: { type: String, required: true, unique: true },
  // TTL index: MongoDB deletes expired sessions by itself.
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const Session = model('Session', sessionSchema);
