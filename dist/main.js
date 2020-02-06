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
// const createElement = (value: string) => <div id='foo'>{value}</div>;
const container = document.getElementById('root');
// Didact.render(createElement('hello'), container);
function App(props) {
    return Didact.createElement("h1", { name: props.name }, "Hi");
}
Didact.render(Didact.createElement(App, { name: 'foo' }), container);
//# sourceMappingURL=main.js.map