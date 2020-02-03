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
//# sourceMappingURL=didact.js.map