export function createElement(type, props, ...children) {
    return {
        type,
        props: Object.assign(Object.assign({}, props), { children: children.map(child => {
                if (typeof child === 'object') {
                    return child;
                }
                return createTextElement(child);
            }) }),
    };
}
function createTextElement(text) {
    return createElement('TEXT_ELEMENT', { nodeValue: text });
}
export function render(element, container) {
    nextUnitOfWork = {
        node: container,
        props: {
            children: [element],
        },
    };
    // element.props.children.forEach(child => {
    //   render(child, node);
    // });
    // container.appendChild(node);
}
let nextUnitOfWork;
function workLoop(deadline) {
    let shouldYield = false;
    while (!shouldYield && nextUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    window.requestIdleCallback(workLoop);
}
function performUnitOfWork(fiber) {
    var _a;
    // Add DOM node
    if (!fiber.node) {
        fiber.node = createDom(fiber);
    }
    if ((_a = fiber.parent) === null || _a === void 0 ? void 0 : _a.node) {
        fiber.parent.node.appendChild(fiber.node);
    }
    // Create new fibers
    let prevSibling;
    fiber.props.children.forEach((element, index) => {
        const newFiber = {
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
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    return;
}
function createDom(fiber) {
    if (!fiber.type) {
        throw new Error(`Attempting to create a DOM from a fiber without type.`);
    }
    const node = fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type);
    Object.keys(fiber.props)
        .filter(key => key !== 'children')
        .forEach(key => {
        node[key] = fiber.props[key];
    });
    return node;
}
window.requestIdleCallback(workLoop);
//# sourceMappingURL=didact.js.map