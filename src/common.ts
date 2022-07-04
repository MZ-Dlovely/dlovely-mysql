/*
 * @Author: Dlovely
 * @Date: 2022-06-16 16:10:20
 * @LastEditors: Dlovely
 * @LastEditTime: 2022-07-04 20:48:43
 * @Description: 公用函数
 * @FilePath: \mysql\src\common.ts
 * Copyright (c) 2022 by Dlovely, All Rights Reserved.
 */
/**
 * 控制台样式表
 * @param bright 亮色
 * @param grey 灰色
 * @param italic 斜体
 * @param underline 下划线
 * @param reverse 反向
 * @param hidden 隐藏
 * @param black 黑色
 * @param red 红色
 * @param green 绿色
 * @param yellow 黄色
 * @param blue 蓝色
 * @param magenta 品红
 * @param cyan 青色
 * @param white 白色
 * @param blackBG 背景色为黑色
 * @param redBG 背景色为红色
 * @param greenBG 背景色为绿色
 * @param yellowBG 背景色为黄色
 * @param blueBG 背景色为蓝色
 * @param magentaBG 背景色为品红
 * @param cyanBG 背景色为青色
 * @param whiteBG 背景色为白色
 */
export const con_style = {
	bright: '\x1B[1m', // 亮色
	grey: '\x1B[2m', // 灰色
	italic: '\x1B[3m', // 斜体
	underline: '\x1B[4m', // 下划线
	reverse: '\x1B[7m', // 反向
	hidden: '\x1B[8m', // 隐藏
	black: '\x1B[30m', // 黑色
	red: '\x1B[31m', // 红色
	green: '\x1B[32m', // 绿色
	yellow: '\x1B[33m', // 黄色
	blue: '\x1B[34m', // 蓝色
	magenta: '\x1B[35m', // 品红
	cyan: '\x1B[36m', // 青色
	white: '\x1B[37m', // 白色
	blackBG: '\x1B[40m', // 背景色为黑色
	redBG: '\x1B[41m', // 背景色为红色
	greenBG: '\x1B[42m', // 背景色为绿色
	yellowBG: '\x1B[43m', // 背景色为黄色
	blueBG: '\x1B[44m', // 背景色为蓝色
	magentaBG: '\x1B[45m', // 背景色为品红
	cyanBG: '\x1B[46m', // 背景色为青色
	whiteBG: '\x1B[47m', // 背景色为白色
} as const
export const conStyle = (text: any, ...styles: Array<keyof typeof con_style>) =>
	`${styles.map(style => con_style[style]).join('')}${text}\x1B[0m`

const con =
	(
		header: string,
		type: 'log' | 'warn' | 'error',
		c1: keyof typeof con_style,
		c2: keyof typeof con_style,
	) =>
	(...message: any[]) =>
		console[type](
			conStyle(`[${header}]`, c1),
			conStyle(`[${new Date().toLocaleString()}]`, c1),
			...message.map(msg => conStyle(msg, c2)),
		)
export const createToast = <L extends boolean = false>(
	header: string,
	log?: L,
): L extends true
	? {
			log: (...message: any[]) => void
			warn: (...message: any[]) => void
			error: (...message: any[]) => void
	  }
	: {
			log: () => void
			warn: () => void
			error: () => void
	  } => {
	const empty = () => {}
	const toast = {
		log: empty,
		warn: empty,
		error: empty,
	}
	if (!log) return toast
	toast.log = con(header, 'log', 'green', 'blue')
	toast.warn = con(header, 'warn', 'yellow', 'cyan')
	toast.error = con(header, 'error', 'red', 'magenta')
	return toast
}
