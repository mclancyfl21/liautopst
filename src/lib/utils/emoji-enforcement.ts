const COMMON_EMOJIS = ['🚀', '📈', '💡', '🔥', '✅', '✨', '👉', '📌', '💼', '🌟'];

export function enforceEmojis(text: string): string {
  const paragraphs = text.split(/\n+/);
  const processedParagraphs = paragraphs.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return '';

    // Check if it already starts with an emoji (basic check for common emoji ranges)
    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    if (emojiRegex.test(trimmed)) {
      return trimmed;
    }

    // Prepend a random common emoji if none found
    const randomEmoji = COMMON_EMOJIS[Math.floor(Math.random() * COMMON_EMOJIS.length)];
    return `${randomEmoji} ${trimmed}`;
  });

  return processedParagraphs.filter(Boolean).join('\n\n');
}
