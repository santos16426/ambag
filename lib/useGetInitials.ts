function getInitial(name: string | null, email: string): string {
  if (name?.trim()) {
    return name.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

export default getInitial;

