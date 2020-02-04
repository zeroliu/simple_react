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

interface Fiber {
  type?: string;
  node?: HTMLElement | Text;
  props: ElementProps;
  parent?: Fiber;
  sibling?: Fiber;
  child?: Fiber;
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
  wipRoot = {
    node: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
function workLoop(deadline: RequestIdleCallbackDeadline) {
  let shouldYield = false;
  while (!shouldYield && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  window.requestIdleCallback(workLoop);
}

function commitRoot() {
  commitFiber(wipRoot);
  wipRoot = null;
}

function commitFiber(fiber?: Fiber | null) {
  if (!fiber?.node) return;
  if (fiber.parent?.node) {
    fiber.parent.node.appendChild(fiber.node);
  }
  commitFiber(fiber.child);
  commitFiber(fiber.sibling);
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  // Add DOM node
  if (!fiber.node) {
    fiber.node = createDom(fiber);
  }

  // Create new fibers
  let prevSibling: Fiber | undefined;
  fiber.props.children.forEach((element, index) => {
    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
    };
    if (prevSibling) {
      prevSibling.sibling = newFiber;
    }
    if (index === 0) {
      fiber.child = newFiber;
    }
    prevSibling = newFiber;
  });

  // Return next unit of work
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber: Fiber | undefined = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }

  return null;
}

function createDom(fiber: Fiber) {
  if (!fiber.type) {
    throw new Error(`Attempting to create a DOM from a fiber without type.`);
  }
  const node =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);
  Object.keys(fiber.props)
    .filter(key => key !== 'children')
    .forEach(key => {
      (node as Record<string, any>)[key] = fiber.props[key];
    });
  return node;
}

window.requestIdleCallback(workLoop);
