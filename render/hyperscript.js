"use strict"

var Vnode = require("../render/vnode")

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}
var hasOwn = {}.hasOwnProperty
function isString(x) {
  return ((typeof x === 'string') && (x.length > 0))
}


function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {}
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2]
		if (type === "" && value !== "") tag = value
		else if (type === "#") attrs.id = value
		else if (type === ".") classes.push(value)
		else if (match[3][0] === "[") {
			var attrValue = match[6]
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
			if (match[4] === "class") classes.push(attrValue)
			else attrs[match[4]] = attrValue || true
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ")
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}

function execSelector(state, attrs, children) {
	var hasAttrs = false, childList, text
	var className = attrs.className || attrs.class

	for (var key in state.attrs) {
		if (hasOwn.call(state.attrs, key)) {
			attrs[key] = state.attrs[key]
		}
	}

	if (className !== undefined) {
		if (attrs.class !== undefined) {
			attrs.class = undefined
			attrs.className = className
		}

		if (state.attrs.className != null) {
			attrs.className = state.attrs.className + " " + className
		}
	}

	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && key !== "key") {
			hasAttrs = true
			break
		}
	}

	if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
		text = children[0].children
	} else {
		childList = children
	}

	return Vnode(state.tag, attrs.key, hasAttrs ? attrs : undefined, childList, text)
}

function hyperscript(selector) {
	// Because sloppy mode sucks
	var attrs = {}, start = 1, children

	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}

	if (typeof selector === "string") {
		var cached = selectorCache[selector] || compileSelector(selector)
	}

	if (arguments.length === start + 1) {
		if (isString(arguments[start]) && (arguments[start].startsWith('.'))){
			attrs.className = arguments[start].substring(1).split('.').join(' ')
		}
		else if (typeof arguments[start] === "object" && !Array.isArray(arguments[start])) {
			attrs = Object.assign(attrs, arguments[start])
		}
		else
		{
			children = arguments[start]
		}

		if (!Array.isArray(children)) children = [children]
		} else {
			children = []
			while (start < arguments.length) {
				if (isString(arguments[start]) && (arguments[start].startsWith('.')))
				{
					attrs.className = arguments[start].substring(1).split('.').join(' ')
				}
				else if (typeof arguments[start] === "object" && !Array.isArray(arguments[start])) {
					attrs = Object.assign(attrs, arguments[start])
				}
				else
				{
					children.push(arguments[start])
				}
				start++
			}
		}

	var normalized = Vnode.normalizeChildren(children)

	if (typeof selector === "string") {
		return execSelector(cached, attrs, normalized)
	} else {
		return Vnode(selector, attrs.key, attrs, normalized)
	}
}

module.exports = hyperscript
