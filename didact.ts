type Child = DidactElement | string | number;

interface Props {
  children?: DidactElement[];
  [key: string]: any;
}

interface DidactElement {
  type: string;
  props: Props;
}

export function createElement(
  type: string,
  props?: Props,
  ...children: Child[]
): DidactElement {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        if (typeof child === 'object') {
          return child;
        }
        return createTextElement(child);
      }),
    },
  };
}

function createTextElement(text: string | number) {
  return createElement('TEXT_ELEMENT', { nodeValue: text });
}
