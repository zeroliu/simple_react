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
  type?: string | Function;
  node?: HTMLElement | Text;
  props: ElementProps;
  parent?: Fiber;
  sibling?: Fiber;
  child?: Fiber;
  alternate?: Fiber | null;
  effectTag?: 'UPDATE' | 'PLACEMENT' | 'DELETION';
}

let nextUnitOfWork: Fiber | null = null;
// last fiber tree we committed to the DOM.
let currentRoot: Fiber | null = null;
let wipRoot: Fiber | null = null;
let deletions: Fiber[] = [];

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
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

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
  deletions.forEach(commitFiber);
  commitFiber(wipRoot);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitDeletion(fiber?: Fiber, parent?: HTMLElement | Text) {
  if (fiber?.node) {
    parent?.removeChild(fiber.node);
  } else {
    commitDeletion(fiber?.child, parent);
  }
}

function commitFiber(fiber?: Fiber | null) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber?.node) {
    domParentFiber = domParentFiber?.parent;
  }
  const domParent = domParentFiber?.node;

  if (domParent) {
    if (fiber.effectTag === 'PLACEMENT' && fiber.node) {
      domParent.appendChild(fiber.node);
    } else if (fiber.effectTag === 'DELETION') {
      commitDeletion(fiber, domParent);
    } else if (fiber.effectTag === 'UPDATE' && fiber.node) {
      // update dom
      updateDOM(fiber.node, fiber.alternate?.props!, fiber.props);
    }
  }

  commitFiber(fiber.child);
  commitFiber(fiber.sibling);
}

const isEvent = (key: string) => key.startsWith('on');
const isProperty = (key: string) => key !== 'children' && !isEvent(key);
const isNew = (prev: ElementProps, next: ElementProps) => (key: string) =>
  prev[key] !== next[key];
const isGone = (next: ElementProps) => (key: string) => !(key in next);
function updateDOM(
  dom: HTMLElement | Text,
  prevProps: ElementProps,
  nextProps: ElementProps,
) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => isGone(nextProps)(key) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach(name => {
      ((dom as unknown) as Record<string, string>)[name] = '';
    });

  // set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      ((dom as unknown) as Record<string, string>)[name] = nextProps[name];
    });

  // add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function updateFunctionComponent(fiber: Fiber) {
  if (!(fiber.type instanceof Function)) {
    throw new Error('Attempting to update a non function component.');
  }
  const children = [fiber.type(fiber.props)];
  reconsileChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.node) {
    fiber.node = createDom(fiber);
  }
  reconsileChildren(fiber, fiber.props.children);
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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
    throw new Error('Attempting to create a DOM from a fiber without type.');
  }
  if (fiber.type instanceof Function) {
    throw new Error(
      'Attempting to create a DOM form a fiber with function type.',
    );
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

function reconsileChildren(wipFiber: Fiber, elements: DidactElement[]) {
  let prevSibling: Fiber | undefined = undefined;
  let oldFiber = wipFiber.alternate?.child;
  let index = 0;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber: Fiber | undefined = undefined;

    // Compare oldFiber to element
    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        node: oldFiber!.node,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      // add the node
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        effectTag: 'PLACEMENT',
      };
    }
    if (oldFiber && !sameType) {
      // remove the oldFiber's node
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (newFiber)
      if (index === 0) {
        wipFiber.child = newFiber;
      } else {
        prevSibling!.sibling = newFiber;
      }
    prevSibling = newFiber;
    index++;
  }
}

window.requestIdleCallback(workLoop);
