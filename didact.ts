type Child = DidactElement | string | number;

interface InputProps {
  [key: string]: any;
}

interface ElementProps extends InputProps {
  children: DidactElement[];
}

interface DidactElement {
  type: string;
  props: ElementProps;
}

export function createElement(
  type: string,
  props?: InputProps,
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

export function render(element: DidactElement, container: HTMLElement | Text) {
  const node =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  Object.keys(element.props)
    .filter(key => key !== 'children')
    .forEach(key => {
      (node as Record<string, any>)[key] = element.props[key];
    });

  element.props.children.forEach(child => {
    render(child, node);
  });
  container.appendChild(node);
}
