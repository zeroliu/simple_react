// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// )
// const element = React.createElement(
//   'div',
//   { id: 'foo' },
//   React.createElement('a', null, 'bar'),
//   React.createElement('b'),
// );
import * as Didact from './didact.js';
// const a = createElement('a', undefined, 'bar');
// const b = createElement('b');
// const element = createElement('div', undefined, a, b);
const element = (Didact.createElement("div", { id: 'foo' },
    Didact.createElement("a", null, "bar"),
    Didact.createElement("b", null)));
const container = document.getElementById('root');
Didact.render(element, container);
//# sourceMappingURL=main.js.map