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
const createElement = (value) => Didact.createElement("div", { id: 'foo' }, value);
const container = document.getElementById('root');
Didact.render(createElement('hello'), container);
setTimeout(() => Didact.render(createElement('world'), container), 1000);
//# sourceMappingURL=main.js.map