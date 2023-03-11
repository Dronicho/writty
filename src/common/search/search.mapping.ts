export const Mapping = {
  properties: {
    title: {
      type: 'text',
      // analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          // ignore_above: 256,
        },
        
      },
    },
    description: {
      type: 'text',
      // analyzer: 'english',
      fields: {
        keyword: {
          type: 'keyword',
          // ignore_above: 256,
        },
      },
    },
  },
};
