// React: const element = <h1 title="foo">Hello</h1>;
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello World',
  },
};
const container = document.getElementById('root');

// React: ReactDOM.render(element, container);

// create a node using the element type
const node = document.createElement(element.type);
// assign all the element props to that node
node.title = element.props.title;
// create the nodes for children
const text = document.createTextNode('');
text.nodeValue = element.props.children;
// append childNode to the element
node.appendChild(text);
// append element to the container
container.appendChild(node);
