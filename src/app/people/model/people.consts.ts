export const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;

export const CHILD_SIZES = Array.from({ length: 22 }, (_, step) =>
  String(50 + step * 6)
);

export const SHOE_SIZES = Array.from({ length: 35 }, (_, step) => 16 + step);
