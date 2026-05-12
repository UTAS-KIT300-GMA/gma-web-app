// EMAIL
export function validateEmail(email: string): string | null {
  if (!email.includes("@") || !email.includes(".")) {
    return "Email must contain @ and a dot.";
  }
  if (email.includes(" ")) {
    return "Email must not contain spaces.";
  }
  return null;
}

// PASSWORD
export function validatePassword(password: string): string | null {
  if (password.length < 10 || password.length > 64) {
    return "Password must be 10–64 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

// PHONE (AUSTRALIA)
export function normalisePhone(phone: string): { value: string | null; error: string | null } {
  const cleaned = phone.replace(/\s+/g, "");

  // local format: 04XXXXXXXX
  if (/^04\d{8}$/.test(cleaned)) {
    return {
      value: "+61" + cleaned.slice(1),
      error: null,
    };
  }

  // international format: +614XXXXXXXX
  if (/^\+614\d{8}$/.test(cleaned)) {
    return {
      value: cleaned,
      error: null,
    };
  }

  return {
    value: null,
    error: "Phone must be Australian format (e.g. 0412345678 or +61412345678).",
  };
}