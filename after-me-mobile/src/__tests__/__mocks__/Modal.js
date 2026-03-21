const React = require('react');
const { View } = require('react-native');

const MockModal = (props) => {
  if (!props.visible) return null;
  return React.createElement(View, null, props.children);
};

module.exports = MockModal;
