const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginResponse {
  success: boolean;
  message: string;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  token: string | null;
  roles: string[] | null;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/Auths/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  return res.json();
}
