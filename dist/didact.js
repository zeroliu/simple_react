let nextUnitOfWork = null;
// last fiber tree we committed to the DOM.
let currentRoot = null;
let wipRoot = null;
let deletions = [];
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
        alternate: currentRoot,
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
}
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
    deletions.forEach(commitFiber);
    commitFiber(wipRoot);
    currentRoot = wipRoot;
    wipRoot = null;
}
function commitDeletion(fiber, parent) {
    var _a, _b, _c;
    if ((_a = fiber) === null || _a === void 0 ? void 0 : _a.node) {
        (_b = parent) === null || _b === void 0 ? void 0 : _b.removeChild(fiber.node);
    }
    else {
        commitDeletion((_c = fiber) === null || _c === void 0 ? void 0 : _c.child, parent);
    }
}
function commitFiber(fiber) {
    var _a, _b, _c, _d;
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.parent;
    while (domParentFiber && !((_a = domParentFiber) === null || _a === void 0 ? void 0 : _a.node)) {
        domParentFiber = (_b = domParentFiber) === null || _b === void 0 ? void 0 : _b.parent;
    }
    const domParent = (_c = domParentFiber) === null || _c === void 0 ? void 0 : _c.node;
    if (domParent) {
        if (fiber.effectTag === 'PLACEMENT' && fiber.node) {
            domParent.appendChild(fiber.node);
        }
        else if (fiber.effectTag === 'DELETION') {
            commitDeletion(fiber, domParent);
        }
        else if (fiber.effectTag === 'UPDATE' && fiber.node) {
            // update dom
            updateDOM(fiber.node, (_d = fiber.alternate) === null || _d === void 0 ? void 0 : _d.props, fiber.props);
        }
    }
    commitFiber(fiber.child);
    commitFiber(fiber.sibling);
}
const isEvent = (key) => key.startsWith('on');
const isProperty = (key) => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (next) => (key) => !(key in next);
function updateDOM(dom, prevProps, nextProps) {
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
        dom[name] = '';
    });
    // set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
        dom[name] = nextProps[name];
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
function updateFunctionComponent(fiber) {
    if (!(fiber.type instanceof Function)) {
        throw new Error('Attempting to update a non function component.');
    }
    const children = [fiber.type(fiber.props)];
    reconsileChildren(fiber, children);
}
function updateHostComponent(fiber) {
    if (!fiber.node) {
        fiber.node = createDom(fiber);
    }
    reconsileChildren(fiber, fiber.props.children);
}
function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    }
    else {
        updateHostComponent(fiber);
    }
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
        throw new Error('Attempting to create a DOM from a fiber without type.');
    }
    if (fiber.type instanceof Function) {
        throw new Error('Attempting to create a DOM form a fiber with function type.');
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
function reconsileChildren(wipFiber, elements) {
    var _a;
    let prevSibling = undefined;
    let oldFiber = (_a = wipFiber.alternate) === null || _a === void 0 ? void 0 : _a.child;
    let index = 0;
    while (index < elements.length || oldFiber) {
        const element = elements[index];
        let newFiber = undefined;
        // Compare oldFiber to element
        const sameType = oldFiber && element && oldFiber.type === element.type;
        if (sameType) {
            // update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                node: oldFiber.node,
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
            }
            else {
                prevSibling.sibling = newFiber;
            }
        prevSibling = newFiber;
        index++;
    }
}
window.requestIdleCallback(workLoop);
//# sourceMappingURL=didact.js.map