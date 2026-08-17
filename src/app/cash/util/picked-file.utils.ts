export const takePickedFiles = (event: Event): File[] => {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = '';
  return files;
};
