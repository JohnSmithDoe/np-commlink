/**
 * Read the file out of an `<input type="file">` change event and clear the input
 * in the same breath: a file input keeps its value, so re-picking the SAME file
 * would not fire another change event and a retried import would look ignored.
 */
export const takePickedFile = (event: Event): File | undefined => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  return file;
};
