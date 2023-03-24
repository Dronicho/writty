export function getDescription(blocks: any[]): string {
  return blocks.find((e) => e.type === 'paragraph')?.data.text ?? '';
}

export function getCurrency(title: string): string {
  const splitted = title.split(' ');
  if (splitted.length >= 3) {
    return splitted
      .slice(0, 3)
      .map((e) => e[0])
      .join('')
      .toUpperCase();
  }
  return title.slice(0, 3).toUpperCase();
}

export function computeUrl(address: string, title: string): string {
  return (
    title
      .split(' ')
      .map((e) => e.toLowerCase())
      .join('-') +
    '-' +
    simpleHash(address)
  );
}

export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36);
}
