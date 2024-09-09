import { ThemeConfig } from 'antd';

// Could be easily modified in theme editor
// https://ant.design/theme-editor
const antTheme: ThemeConfig = {
	cssVar: true,
	token: {
		colorIcon: '#000000',
		fontSizeIcon: 16,
		colorSuccess: '#5ed686',
		colorSuccessBg: '#dffbe7',
		colorSuccessBgHover: '#dffbe7',
		colorSuccessBorder: '#c4f0d7',
		colorSuccessBorderHover: '#c4f0d7',
		colorSuccessHover: '#5ed686',
		colorSuccessActive: '#5ed686',
		colorSuccessTextHover: '#3bb300',
		colorSuccessText: '#3bb300',
		colorSuccessTextActive: '#3bb300',
		colorWarning: '#ffb200',
		colorWarningBg: '#fff5d1',
		colorWarningBgHover: '#fff5d1',
		colorWarningBorder: '#ffe8a3',
		colorWarningBorderHover: '#ffe8a3',
		colorWarningHover: '#ffb200',
		colorWarningActive: '#ffb200',
		colorWarningTextHover: '#ff7733',
		colorWarningText: '#ff7733',
		colorWarningTextActive: '#ff7733',
		colorError: '#ff4433',
		colorErrorBg: '#ffeceb',
		colorErrorBgHover: '#ffeceb',
		colorErrorBorder: '#ffdfdb',
		colorErrorBorderHover: '#ffdfdb',
		colorErrorHover: '#ff4433',
		colorErrorActive: '#ff4433',
		colorErrorTextHover: '#ff4433',
		colorErrorText: '#ff4433',
		colorErrorTextActive: '#ff4433',
		fontFamily: 'var(--font-family)',
		fontFamilyCode: 'var(--font-family)',
		fontWeightStrong: 700,
		colorBgLayout: '#f6f6f6',
		borderRadius: 8,
		borderRadiusSM: 4,
		borderRadiusXS: 2,
		borderRadiusLG: 16,
		colorTextSecondary: '#878787',
		colorTextTertiary: '#cccccc',
		colorTextQuaternary: '#e3e3e3',
		colorBorder: '#eeeeee',
		colorBorderSecondary: '#eeeeee',
		boxShadow:
			'0px 2px 4px 0px rgba(95, 105, 131, 0.20), 0px 0px 2px 0px rgba(95, 105, 131, 0.08);',
		boxShadowSecondary:
			'0px -4px 30px 0px rgba(95, 105, 131, 0.12), 0px 0px 4px 0px rgba(95, 105, 131, 0.06);',
		lineHeight: 1.43,
		colorPrimary: '#313133',
		colorInfo: '#313133',
		colorPrimaryBg: '#ebecf0',
		colorPrimaryBgHover: '#dfe1e8',
		colorPrimaryBorder: '#313133',
		colorPrimaryBorderHover: '#4a4b4d',
		colorPrimaryHover: '#4a4b4d',
		colorPrimaryActive: '#1d1e1f',
		colorPrimaryTextHover: '#333333',
		colorPrimaryText: '#000000',
		colorPrimaryTextActive: '#000000',
		colorText: '#000000'
	},
	components: {
		Layout: {
			headerBg: '#f6f6f6',
			footerBg: '#f6f6f6',
			bodyBg: '#f6f6f6',
			footerPadding: '0',
			headerPadding: '0'
		},
		Button: {
			controlHeightSM: 32,
			controlHeight: 40,
			controlHeightLG: 52,
			defaultBg: 'rgb(242, 242, 243)',
			defaultHoverBg: 'rgb(238, 238, 239)',
			defaultActiveBg: 'rgb(238, 238, 239)',
			defaultColor: 'rgba(0, 0, 0, 0.88)',
			defaultHoverColor: 'var(--ant-color-text)',
			defaultActiveColor: 'var(--ant-color-text)',
			defaultHoverBorderColor: 'var(--ant-color-text)',
			defaultActiveBorderColor: 'var(--ant-color-text)',
			dangerShadow: '0',
			defaultShadow: ' 0',
			primaryShadow: '0',
			borderRadiusSM: 8,
			borderRadiusLG: 12,
			lineWidth: 0,
			lineWidthFocus: 0,
			textHoverBg: 'none'
		},
		Segmented: {
			controlPaddingHorizontal: 0,
			controlPaddingHorizontalSM: 0,
			lineWidth: 0,
			borderRadiusSM: 8,
			borderRadius: 12,
			trackBg: '#ebebeb',
			itemColor: 'var(--ant-color-text-secondary)',
			itemSelectedColor: 'var(--ant-color-text)'
		},
		Typography: {
			titleMarginBottom: '0',
			titleMarginTop: '0'
		},
		Input: {
			hoverBorderColor: '#4a4b4d',
			activeBorderColor: '#313133',
			activeShadow: '0 0 0 2px rgba(5, 17, 67, 0.08)'
		}
	}
};

export default antTheme;
