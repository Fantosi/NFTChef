export const isCommand = (text: string, command: string) => {
  if (text.includes(`/${command}`)) {
    return true;
  } else {
    return false;
  }
};

export const getCommand = (text: string | undefined) => {
  if (text) {
    const firstChunk = text.split(' ')[0];
    if (firstChunk[0] === '/') {
      return firstChunk.slice(1);
    }
  }
  return undefined;
};

export const getContentFromCommand = (text: string) => {
  return text.split(' ').slice(1).join(' ');
};
