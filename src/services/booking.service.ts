/**
 * =============================================================================
 * booking.service.ts — BookingService (authenticated REPOSITORY, Restful Booker)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Restful Booker is a REAL stateful API where mutations require auth. This
 *   repository exposes the full lifecycle (list/read/create/update/patch/delete)
 *   as domain methods, and makes the auth requirement EXPLICIT: mutating methods
 *   demand an AuthStrategy, so a test physically cannot delete without presenting
 *   credentials. It is the backbone of the Phase 7 chaining flow.
 *
 * DESIGN:
 *   - Reads/create take no auth (Booker allows them unauthenticated).
 *   - update/patch/remove require an AuthStrategy parameter (per-request auth,
 *     reusing the Strategy pattern from Phase 4).
 *   - Booker quirks encapsulated here: collection returns id refs only; DELETE
 *     returns 201; mutations need Accept: application/json (set by the client).
 * =============================================================================
 */
import { BaseApiService } from './base.service.js';
import type { ApiClient, ApiResponse } from '../api-client/index.js';
import type { AuthStrategy } from '../auth/index.js';
import type {
  Booking,
  BookingIdRef,
  CreateBookingResponse,
} from '../models/booking.model.js';

export class BookingService extends BaseApiService {
  public constructor(client: ApiClient) {
    super(client, '/booking');
  }

  /** LIST — GET /booking (returns id references only, not full bookings). */
  public getAllIds(): Promise<ApiResponse<BookingIdRef[]>> {
    return this.client.get<BookingIdRef[]>(this.resource);
  }

  /** READ — GET /booking/{id} (200 with booking, or 404 if absent). */
  public getById(id: number): Promise<ApiResponse<Booking>> {
    return this.client.get<Booking>(this.url(id));
  }

  /** CREATE — POST /booking (no auth needed; returns { bookingid, booking }). */
  public create(booking: Booking): Promise<ApiResponse<CreateBookingResponse>> {
    return this.client.post<CreateBookingResponse>(this.resource, {
      data: booking,
    });
  }

  /** REPLACE — PUT /booking/{id} (REQUIRES auth). */
  public update(
    id: number,
    booking: Booking,
    auth: AuthStrategy,
  ): Promise<ApiResponse<Booking>> {
    return this.client.put<Booking>(this.url(id), { data: booking, auth });
  }

  /** PARTIAL UPDATE — PATCH /booking/{id} (REQUIRES auth). */
  public partialUpdate(
    id: number,
    partial: Partial<Booking>,
    auth: AuthStrategy,
  ): Promise<ApiResponse<Booking>> {
    return this.client.patch<Booking>(this.url(id), { data: partial, auth });
  }

  /** DELETE — DELETE /booking/{id} (REQUIRES auth; Booker returns 201). */
  public remove(id: number, auth: AuthStrategy): Promise<ApiResponse<unknown>> {
    return this.client.del(this.url(id), { auth });
  }
}
