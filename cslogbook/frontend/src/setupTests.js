// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// ตั้งค่า environment variables สำหรับ test
import './setupEnvTest';

jest.mock('@react-pdf/renderer', () => {
	const React = require('react');
	const createBlob = () => {
		if (typeof Blob !== 'undefined') {
			return new Blob(['mock']);
		}
		return 'mock-blob';
	};

	return {
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
});

jest.mock('./services/apiClient', () => require('./__mocks__/apiClient'));
