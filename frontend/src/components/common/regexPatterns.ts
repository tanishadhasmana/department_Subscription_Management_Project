/* eslint-disable no-useless-escape */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;

/** URL validation: must start with http:// or https:// */
export const URL_REGEX =
  /^(https?:\/\/)([\w\-]+(\.[\w\-]+)+)([\/\w\-.,@?^=%&:;+#]*)?$/;

/** Single digit (used for per-input OTP digit) */
export const DIGIT_REGEX = /^\d$/;

/** Full digit string (used for pasted OTP or any numeric-only string) */
export const DIGITS_REGEX = /^\d+$/;