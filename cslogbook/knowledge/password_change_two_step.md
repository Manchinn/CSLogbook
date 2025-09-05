# Password Change Two-Step Flow (Current Password + OTP)

This document describes the enforced two-step password change process for students.

## Summary
1. User opens password change modal.
2. Step 1: Submit currentPassword + newPassword.
   - Backend validates current password and policy.
   - Hashes new password temporarily and stores in `password_reset_tokens.temp_new_password_hash` with OTP hash.
   - Sends OTP email. (TTL: 10 minutes default)
3. Step 2: User submits OTP only.
   - Backend validates OTP and marks token used.
   - Applies stored hash as the new user password.
   - Response contains `forceLogout: true`.
4. Frontend logs the user out and requires new login using updated password.

## Endpoints
POST /auth/password/change/init
Body: { currentPassword, newPassword }
Response: { success, message, expiresIn }

POST /auth/password/change/confirm
Body: { otp }
Response: { success, message, forceLogout }

Legacy endpoints ถูกลบแล้ว (direct in-session & OTP-only แบบเดิม)

## Database
- Table: password_reset_tokens
- New column: temp_new_password_hash (STRING, nullable)
- During init: new hashed password placed here until OTP confirmation.
- After confirm: token.used_at set. No plaintext passwords ever stored.

## Security
- OTP length: env PASSWORD_OTP_LENGTH (default 6 numeric)
- OTP TTL: PASSWORD_OTP_TTL_MINUTES (default 10)
- Cooldown: PASSWORD_OTP_REQUEST_COOLDOWN_SECONDS (default 60)
- Max attempts: PASSWORD_OTP_MAX_ATTEMPTS (default 5)
- Password policy: at least one lowercase, one uppercase, one digit, length 8–64 (special character no longer required).
- Timing attack mitigation: dummy bcrypt compare when token missing.
- Force logout ensures old JWT cannot be reused to modify account further (frontend clears tokens).

## Frontend Flow (React)
- Modal shows Steps (Ant Design Steps component): Set Password -> Confirm OTP -> Done
- Step 0 form: currentPassword, newPassword, confirmNewPassword
- On success -> step 1 OTP form
- On OTP confirm -> step 2 success auto logout (2.5s) or immediate button.

## Future Cleanup
- Remove legacy endpoints after all clients updated.
- Optionally add audit log entries referencing token id.

## Error Responses (Representative)
- 400 ข้อมูลไม่ครบถ้วน
- 400 รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านที่เคยใช้ *(ปัจจุบันระบบตรวจเฉพาะไม่ให้ตรงกับรหัสผ่านปัจจุบัน ยังไม่บังคับ history)*
- 400 รหัสผ่านใหม่ไม่เป็นไปตามนโยบายความปลอดภัย
- 400 / 429 โปรดลองใหม่ใน X วินาที (cooldown)
- 400 OTP ไม่ถูกต้องหรือหมดอายุ
- 404 ไม่พบผู้ใช้
- 500 ไม่สามารถส่ง OTP ได้ / เกิดข้อผิดพลาดภายในระบบ

## Env Variables (Optional Overrides)
PASSWORD_OTP_LENGTH
PASSWORD_OTP_TTL_MINUTES
PASSWORD_OTP_MAX_ATTEMPTS
PASSWORD_OTP_REQUEST_COOLDOWN_SECONDS
PASSWORD_MIN_LENGTH
BCRYPT_SALT_ROUNDS

## Logging Events
- wrong_current_password
- otp_sent_two_step / otp_send_failed_two_step
- otp_attempt_limit_reached
- otp_invalid_attempt_two_step
- two_step_password_change_success

## Sequence (Simplified)
User -> init:current+new -> API -> validate -> create token (otp+temp hash) -> send email -> 200
User -> confirm:otp -> API -> fetch token -> compare -> set user.password from temp hash -> mark used -> email notice -> {forceLogout:true}
