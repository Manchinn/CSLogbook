const React = require('react');

const createBlob = () => {
	if (typeof Blob !== 'undefined') {
		return new Blob(['mock']);
	}
	return 'mock-blob';
};

module.exports = {
	__esModule: true,
	pdf: jest.fn(() => ({
		toBlob: jest.fn(async () => createBlob()),
	})),
	StyleSheet: {
		create: (styles) => styles,
	},
	Font: {
		register: jest.fn(),
	},
	Document: ({ children }) => React.createElement('div', null, children),
	Page: ({ children }) => React.createElement('div', null, children),
	Text: ({ children }) => React.createElement('span', null, children),
	View: ({ children }) => React.createElement('div', null, children),
	Image: (props) => React.createElement('img', props),
};
