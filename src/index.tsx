import React from 'react';
import { createRoot } from 'react-dom/client';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import { App } from './app/app';
import { formatCurrency, signCurrency } from './common/currency/currency';
import { langs, language } from './langs';

import './vendor.css';
import './styles.css';

import(/* webpackChunkName: "autoplay" */ './autoplay');

i18n.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources: langs,
		lng: language, // if you're using a language detector, do not define the lng option
		fallbackLng: 'en_US',

		interpolation: {
			escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
			format: function (value, format, lng) {
				switch (format) {
					case 'currency':
						return (
							formatCurrency(value) +
							'\u00A0' +
							signCurrency(lng as 'en_US')
						);
				}
				return value;
			}
		}
	});

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
