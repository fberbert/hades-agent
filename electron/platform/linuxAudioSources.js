function parsePulseAudioSources(output) {
  if (!output || typeof output !== 'string') {
    return [];
  }

  return output
    .split(/^Source #/m)
    .map((block) => {
      const nameMatch = block.match(/^\s*Name:\s*(.+?)\s*$/m);
      const descriptionMatch = block.match(/^\s*Description:\s*(.+?)\s*$/m);

      if (!nameMatch || !descriptionMatch) {
        return null;
      }

      const name = nameMatch[1].trim();

      return {
        name,
        description: descriptionMatch[1].trim(),
        isMonitor: name.endsWith('.monitor'),
      };
    })
    .filter(Boolean);
}

module.exports = {
  parsePulseAudioSources,
};
