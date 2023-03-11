const colors = [
  'EF4444',
  'F97316',
  'F59E0B',
  'EAB308',
  '84CC16',
  '22C55E',
  '10B981',
  '14B8A6',
  '06B6D4',
  '0EA5E9',
  '3B82F6',
  '6366F1',
  '8B5CF6',
  'A855F7',
  'D946EF',
  'EC4899',
  'F43F5E',
];

export const generateImage = (name: string): string => {
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?background=${color}&color=fff&name=${name}`;
};
