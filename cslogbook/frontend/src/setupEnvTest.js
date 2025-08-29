// กำหนดค่า env ที่จำเป็นสำหรับ context ต่าง ๆ ก่อนรันเทส
process.env.REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Polyfill window.matchMedia ให้ Ant Design ใช้ได้ใน jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
	window.matchMedia = function matchMedia(query) {
		return {
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {}, // deprecated
			removeListener: () => {}, // deprecated
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		};
	};
}

// Polyfill ResizeObserver (บาง component antd ใช้)
if (typeof window !== 'undefined' && !window.ResizeObserver) {
	window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
