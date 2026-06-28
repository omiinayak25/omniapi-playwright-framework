/**
 * =============================================================================
 * booking.builder.ts — BookingBuilder (BUILDER pattern / Test Data Builder)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Building a valid Booking inline is verbose and brittle. The Builder lets a
 *   test specify ONLY the fields it cares about, fluently, while every other
 *   field gets a sensible random default — so `build()` always yields a VALID
 *   booking. This is the "Test Data Builder" pattern, beloved in test suites.
 *
 * HOW IT WORKS:
 *   - `aBooking()` is the entry point; it seeds Faker-powered valid defaults.
 *   - Each `withX()` mutates the internal draft and returns `this` (fluent chain).
 *   - `build()` returns a fresh DEEP COPY — so two builds never share state
 *     (a classic, nasty builder bug we deliberately avoid).
 *
 * USAGE:
 *   const b = BookingBuilder.aBooking().withFirstname('John').withTotalPrice(500).build();
 * =============================================================================
 */
import { faker } from '@faker-js/faker';
import type { Booking } from '../models/booking.model.js';
import { futureIso } from '../utils/date.js';

/** Internal mutable draft (the model itself is readonly). */
interface BookingDraft {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  checkin: string;
  checkout: string;
  additionalneeds?: string;
}

export class BookingBuilder {
  private constructor(private readonly draft: BookingDraft) {}

  /**
   * Entry point: a builder pre-seeded with VALID random defaults.
   * Override only what your test cares about, then call build().
   */
  public static aBooking(): BookingBuilder {
    return new BookingBuilder({
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      totalprice: faker.number.int({ min: 50, max: 5000 }),
      depositpaid: faker.datatype.boolean(),
      // Guarantee checkin < checkout: 7 days out, 5-night stay.
      checkin: futureIso(7),
      checkout: futureIso(12),
      additionalneeds: faker.helpers.arrayElement([
        'Breakfast',
        'Late checkout',
        'Extra towels',
      ]),
    });
  }

  public withFirstname(firstname: string): this {
    this.draft.firstname = firstname;
    return this;
  }

  public withLastname(lastname: string): this {
    this.draft.lastname = lastname;
    return this;
  }

  public withTotalPrice(totalprice: number): this {
    this.draft.totalprice = totalprice;
    return this;
  }

  public withDepositPaid(depositpaid: boolean): this {
    this.draft.depositpaid = depositpaid;
    return this;
  }

  public withDates(checkin: string, checkout: string): this {
    this.draft.checkin = checkin;
    this.draft.checkout = checkout;
    return this;
  }

  public withAdditionalNeeds(needs: string): this {
    this.draft.additionalneeds = needs;
    return this;
  }

  /** Remove the optional field entirely (for "minimal payload" scenarios). */
  public withoutAdditionalNeeds(): this {
    delete this.draft.additionalneeds;
    return this;
  }

  /** Produce the final immutable Booking — a fresh deep copy each call. */
  public build(): Booking {
    const { firstname, lastname, totalprice, depositpaid, checkin, checkout } =
      this.draft;

    const booking: Booking = {
      firstname,
      lastname,
      totalprice,
      depositpaid,
      bookingdates: { checkin, checkout },
      // exactOptionalPropertyTypes: include the key ONLY when present.
      ...(this.draft.additionalneeds !== undefined
        ? { additionalneeds: this.draft.additionalneeds }
        : {}),
    };
    return booking;
  }
}
