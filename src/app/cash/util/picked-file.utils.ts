export const takePickedFile = (event: Event): File | undefined => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  return file;
};
