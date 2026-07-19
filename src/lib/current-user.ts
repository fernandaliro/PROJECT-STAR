export function getCurrentUser(): string {
  return process.env.CURRENT_USER_NAME || "Desconhecido";
}
