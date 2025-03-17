import React from 'react';

// Element renderer for different block types
export const renderElement = props => {
  const { attributes, children, element } = props;

  switch (element.type) {
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Leaf renderer for text formatting
export const renderLeaf = props => {
  const { attributes, children, leaf } = props;
  
  let formattedChildren = children;
  
  if (leaf.bold) {
    formattedChildren = <strong>{formattedChildren}</strong>;
  }
  
  if (leaf.italic) {
    formattedChildren = <em>{formattedChildren}</em>;
  }
  
  if (leaf.underline) {
    formattedChildren = <u>{formattedChildren}</u>;
  }
  
  if (leaf.code) {
    formattedChildren = <code>{formattedChildren}</code>;
  }

  return <span {...attributes}>{formattedChildren}</span>;
}; 