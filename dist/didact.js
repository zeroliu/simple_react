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
    wipRoot = {
        node: container,
        props: {
            children: [element],
        },
    };
    nextUnitOfWork = wipRoot;
}
let nextUnitOfWork = null;
let wipRoot = null;
function workLoop(deadline) {
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
function commitFiber(fiber) {
    var _a, _b;
    if (!((_a = fiber) === null || _a === void 0 ? void 0 : _a.node))
        return;
    if ((_b = fiber.parent) === null || _b === void 0 ? void 0 : _b.node) {
        fiber.parent.node.appendChild(fiber.node);
    }
    commitFiber(fiber.child);
    commitFiber(fiber.sibling);
}
function performUnitOfWork(fiber) {
    // Add DOM node
    if (!fiber.node) {
        fiber.node = createDom(fiber);
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
    return null;
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