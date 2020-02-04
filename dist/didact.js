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
    const node = element.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(element.type);
    Object.keys(element.props)
        .filter(key => key !== 'children')
        .forEach(key => {
        node[key] = element.props[key];
    });
    element.props.children.forEach(child => {
        render(child, node);
    });
    container.appendChild(node);
}
let nextUnitOfWork = null;
function workLoop(deadline) {
    let shouldYield = false;
    while (!shouldYield && nextUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    window.requestIdleCallback(workLoop);
}
function performUnitOfWork(unitOfWork) {
    return unitOfWork;
}
window.requestIdleCallback(workLoop);
//# sourceMappingURL=didact.js.map