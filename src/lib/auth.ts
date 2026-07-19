import { createHash } from "node:crypto";

export const AUTH_COOKIE_NAME = "star_session";

// O cookie nunca guarda a senha em si — guarda um hash derivado dela, que só
// bate se quem gerou o cookie conhecia APP_PASSWORD.
export function expectedSessionValue(): string {
  const password = process.env.APP_PASSWORD ?? "";
  return createHash("sha256").update(`star-session-salt:${password}`).digest("hex");
}

export function checkPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD ?? "";
  return password.length > 0 && input === password;
}
