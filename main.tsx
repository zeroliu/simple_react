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
const element = (
  <div id='foo'>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
    <a>bar</a>
    <b></b>
  </div>
);
const container = document.getElementById('root')!;
Didact.render(element, container);
